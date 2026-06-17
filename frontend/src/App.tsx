import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginPage from './pages/LoginPage';

/**
 * Application routes. `/` redirects to registration for now; more routes
 * (rides list, etc.) follow with later user stories.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
