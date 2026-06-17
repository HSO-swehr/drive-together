import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH, isValidEmail, isValidPassword } from 'shared';
import { registerUser } from '../api/auth';

/**
 * Registration form. Validates live against the shared validators, posts to
 * /api/auth/register, and on success navigates to the login route. The submit
 * button is disabled while the request is in flight or the input is invalid.
 */
export default function RegisterForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = emailValid && passwordValid;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!formValid || loading) return;

    setLoading(true);
    setError(null);

    const result = await registerUser(email, password);

    if (result.success) {
      // Session cookie is set by the backend; head to login (later: rides list).
      navigate('/login');
      return;
    }

    setError(result.error);
    setLoading(false);
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 col-lg-5 mx-auto">
          <h1 className="mb-4">Registrieren</h1>

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
                className={`form-control${email !== '' && !emailValid ? ' is-invalid' : ''}`}
                value={email}
                maxLength={EMAIL_MAX_LENGTH}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {email !== '' && !emailValid && (
                <div className="invalid-feedback">
                  Bitte gib eine gültige E-Mail-Adresse ein (max. {EMAIL_MAX_LENGTH} Zeichen).
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                className={`form-control${password !== '' && !passwordValid ? ' is-invalid' : ''}`}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {password !== '' && !passwordValid && (
                <div className="invalid-feedback">
                  Das Passwort muss mindestens {PASSWORD_MIN_LENGTH} Zeichen lang sein.
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!formValid || loading}
            >
              {loading ? 'Registriere…' : 'Registrieren'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
