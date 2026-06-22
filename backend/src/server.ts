import Fastify, { type FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { authRoutes } from './routes/auth.js';
import { ridesRoutes } from './routes/rides.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.BACKEND_PORT || '8080', 10);
const HOST = process.env.BACKEND_HOST || '0.0.0.0';
const isDev = process.env.NODE_ENV !== 'production';

// Repo paths (relative to compiled/run location of this file in src/)
const frontendRoot = path.resolve(__dirname, '../../frontend');
const frontendDist = path.join(frontendRoot, 'dist');

/** API endpoints, all mounted under /api/*. */
function registerApi(fastify: FastifyInstance): void {
  fastify.get('/api/health', async () => {
    return { status: 'ok' };
  });

  fastify.register(authRoutes);
  fastify.register(ridesRoutes);

  // TODO: Add bookings routes
}

/**
 * Serve the frontend on the same port as the API (Single-Port architecture).
 * - Production: serve the built bundle from frontend/dist with an SPA fallback.
 * - Development: run Vite as middleware so HMR works on port 8080.
 */
async function registerFrontend(fastify: FastifyInstance): Promise<void> {
  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: frontendRoot,
      appType: 'custom',
      server: { middlewareMode: true },
    });

    await fastify.register(import('@fastify/middie'));
    fastify.use(vite.middlewares);

    // Anything Vite did not handle and that is not an API call -> index.html
    // (transformed by Vite so the dev client / HMR are injected).
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      const template = fs.readFileSync(path.join(frontendRoot, 'index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(request.url, template);
      return reply.type('text/html').send(html);
    });

    fastify.addHook('onClose', async () => {
      await vite.close();
    });
  } else {
    await fastify.register(import('@fastify/static'), {
      root: frontendDist,
      wildcard: false,
    });

    // SPA fallback: serve index.html for unknown non-API routes.
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }
}

async function start(): Promise<void> {
  try {
    initDb();

    const fastify = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
      },
    });

    registerApi(fastify);
    await registerFrontend(fastify);

    await fastify.listen({ port: PORT, host: HOST });

    console.log(`✅ Server running at http://${HOST}:${PORT}`);
    console.log(`   App:  http://${HOST}:${PORT}/`);
    console.log(`   API:  http://${HOST}:${PORT}/api`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
