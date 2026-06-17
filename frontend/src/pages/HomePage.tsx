import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthStatus } from '../api/auth';

/**
 * Start page. Reflects the session state: logged-in visitors see a (for now
 * near-empty) placeholder — the rides list (User Story 4) lands here later —
 * while anonymous visitors get the links into the auth flows.
 */
export default function HomePage() {
  // null = still checking; avoids flashing the anonymous view for logged-in users.
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getAuthStatus().then((status) => {
      if (active) setAuthenticated(status);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 col-lg-5 mx-auto">
          <h1 className="mb-4">drive-together</h1>

          {authenticated === null ? null : authenticated ? (
            <p className="text-muted">
              Du bist angemeldet. Deine Fahrten erscheinen hier in Kürze.
            </p>
          ) : (
            <>
              <p className="text-muted">Mitfahrgelegenheiten organisieren.</p>
              <p>
                <Link to="/login">Anmelden</Link> oder <Link to="/register">Registrieren</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
