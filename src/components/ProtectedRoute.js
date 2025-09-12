import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    console.log('🛡️ ProtectedRoute - показываем загрузку');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute - перенаправляем на логин');
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ ProtectedRoute - показываем защищенный контент');
  return children;
};

export default ProtectedRoute;

