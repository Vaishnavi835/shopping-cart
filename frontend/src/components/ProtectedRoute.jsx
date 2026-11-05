import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  // While checking stored token on mount, show nothing (avoid flash redirect)
  if (loading) return null;

  return token ? children : <Navigate to="/login" replace />;
}
