// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { getDecodedToken } from '../utils/auth';

export const ProtectedRoute = ({ children }) => {
  const tokenData = getDecodedToken();
  
  if (!tokenData || tokenData.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};