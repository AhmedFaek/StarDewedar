// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { getDecodedToken } from '../utils/auth';
import { isAdminRole, hasPermission, getHomePath } from '../utils/permissions';
import AccessDenied from '../pages/AccessDenied';

// Requires a signed-in user with a known admin role.
export const ProtectedRoute = ({ children }) => {
  const tokenData = getDecodedToken();

  if (!tokenData || !isAdminRole(tokenData.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Requires a specific permission. `redirectIfDenied` sends the user to their own
// landing page (used for the dashboard home); otherwise the access-denied page is shown.
export const RequirePermission = ({ permission, redirectIfDenied = false, children }) => {
  const role = getDecodedToken()?.role;

  if (hasPermission(role, permission)) return children;

  if (redirectIfDenied) {
    const home = getHomePath(role);
    if (home) return <Navigate to={home} replace />;
  }

  return <AccessDenied />;
};