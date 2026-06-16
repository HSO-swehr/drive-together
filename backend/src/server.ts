import Fastify from 'fastify';
import { initDb } from './db';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    // Initialize database
    initDb();
    console.log('Database initialized');

    const fastify = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
      },
    });

    // Health check endpoint
    fastify.get('/', async () => {
      return { status: 'ok', message: 'drive-together backend' };
    });

    // API health check
    fastify.get('/api/health', async () => {
      return { status: 'ok' };
    });

    // TODO: Add authentication routes
    // TODO: Add rides routes
    // TODO: Add bookings routes

    await fastify.listen({ port: PORT, host: HOST });

    console.log(`✅ Server running at http://${HOST}:${PORT}`);
    console.log(`API endpoints available at http://${HOST}:${PORT}/api`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
