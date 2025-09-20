import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionGuard from './components/ConnectionGuard';
import LoadingScreenNew from './components/LoadingScreenNew';
import Login from './pages/LoginNew';
import Register from './pages/RegisterNew';
import About from './pages/About';
import RegisterProfile from './pages/RegisterProfile';
import Chat from './pages/Chat';
import ThemeDemo from './pages/ThemeDemo';
import './App.css';
import './styles/theme.css';
import './styles/uikit.css';
import './styles/messenger.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <LoadingScreenNew />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route 
                  path="/register/profile" 
                  element={
                    <ProtectedRoute>
                      <RegisterProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/themes" element={<ThemeDemo />} />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <ConnectionGuard>
                        <Chat />
                      </ConnectionGuard>
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
            </Router>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

