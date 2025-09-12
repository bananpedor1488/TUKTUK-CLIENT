import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const { isAuthenticated, loading, user, accessToken } = useAuth();
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Auth Status</h2>
      <p>Loading: {loading ? 'true' : 'false'}</p>
      <p>Authenticated: {isAuthenticated ? 'true' : 'false'}</p>
      <p>User: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
      <p>Token: {accessToken ? 'exists' : 'null'}</p>
      <p>LocalStorage Token: {localStorage.getItem('accessToken') ? 'exists' : 'null'}</p>
      <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
    </div>
  );
};

export default DebugAuth;
