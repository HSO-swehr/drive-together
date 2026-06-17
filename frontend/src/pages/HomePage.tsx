import { Link } from 'react-router-dom';

/**
 * Start page placeholder. The rides list (User Story 4) will live here later;
 * for now it just points to the auth flows.
 */
export default function HomePage() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 col-lg-5 mx-auto">
          <h1 className="mb-4">drive-together</h1>
          <p className="text-muted">Mitfahrgelegenheiten organisieren.</p>
          <p>
            <Link to="/login">Anmelden</Link> oder <Link to="/register">Registrieren</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
