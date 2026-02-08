import { Navigate } from 'react-router-dom';

function ProtectedRoute({ currentUser, element }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return element;
}

export default ProtectedRoute;
