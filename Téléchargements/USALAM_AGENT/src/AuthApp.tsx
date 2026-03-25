import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './components/LoginScreen';
import EnhancedHomeScreen from './components/EnhancedHomeScreen';
import ContactsScreen from './components/ContactsScreen';
import SOSScreen from './components/SOSScreen';
import EnhancedMapScreen from './components/EnhancedMapScreen';
import ProfileScreen from './components/ProfileScreen';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route publique - Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LoginScreen />
        } 
      />
      
      {/* Routes protégées */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <EnhancedHomeScreen />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/contacts" 
        element={
          <ProtectedRoute>
            <ContactsScreen />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/sos" 
        element={
          <ProtectedRoute>
            <SOSScreen />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/map" 
        element={
          <ProtectedRoute>
            <EnhancedMapScreen />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirection par défaut */}
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
        } 
      />
      
      {/* Route 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-4">404</h1>
              <p className="text-slate-400">Page non trouvée</p>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

const AuthApp: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default AuthApp;
