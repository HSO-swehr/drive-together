import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';

/**
 * Login form. Posts email + password to /api/auth/login and on success navigates
 * to the start page. Validation is deliberately light — the button only requires
 * both fields to be non-empty; invalid credentials are reported by the backend
 * (401) rather than guessed at in the UI.
 */
export default function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formValid = email !== '' && password !== '';

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!formValid || loading) return;

    setLoading(true);
    setError(null);

    const result = await loginUser(email, password);

    if (result.success) {
      // Session cookie is set by the backend; head to the start page.
      navigate('/');
      return;
    }

    setError(result.error);
    setLoading(false);
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 col-lg-5 mx-auto">
          <h1 className="mb-4">Anmelden</h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!formValid || loading}
            >
              {loading ? 'Melde an…' : 'Anmelden'}
            </button>
          </form>

          <p className="mt-3 text-center">
            Noch kein Konto? <Link to="/register">Registrieren</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
