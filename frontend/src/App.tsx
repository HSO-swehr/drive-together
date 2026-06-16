import { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  message?: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = (await response.json()) as HealthStatus;
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h1 className="mb-4">🚗 drive-together</h1>
          <p className="lead">Mitfahrgelegenheiten einfach organisieren</p>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="card-title mb-0">API Health Status</h5>
            </div>
            <div className="card-body">
              {loading && (
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  ❌ API Error: {error}
                </div>
              )}
              {health && (
                <div className="alert alert-success" role="alert">
                  ✅ API Status: <strong>{health.status}</strong>
                  {health.message && <p className="mb-0 mt-2">{health.message}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Nächste Schritte</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">✅ Frontend läuft auf Port 8080</li>
                <li className="list-group-item">✅ API erreichbar unter /api/</li>
                <li className="list-group-item">⏳ Implementierung der User Stories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
