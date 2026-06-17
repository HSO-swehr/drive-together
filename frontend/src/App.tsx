import { Routes, Route } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

/**
 * Application routes. `/` is the start page; more routes (rides list, etc.)
 * follow with later user stories.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
