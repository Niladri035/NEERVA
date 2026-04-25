import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but incorrect role
    return (
      <main className="page-wrapper" style={{ paddingTop: '160px', display: 'flex', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="#ff006e" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>Access Denied</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Your current role (<strong>{user.role}</strong>) does not have permission to view this page.
          </p>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', width: '100%' }}>
            Return to Home
          </a>
        </div>
      </main>
    );
  }

  return children;
}
