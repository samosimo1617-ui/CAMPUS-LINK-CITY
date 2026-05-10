// src/AuthWrapper.jsx
// ─────────────────────────────────────────────────────────
//  Wrapper de protection : si non connecté → AuthPage
//  Sinon → rendu des enfants (App normale)
// ─────────────────────────────────────────────────────────
import React from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './AuthPage';

const C = {
  dark:  '#0B0F19',
  green: '#B7FF6B',
  muted: 'rgba(255,255,255,0.35)',
};

// Écran de chargement pendant la vérification Firebase
const LoadingScreen = () => (
  <div style={{
    minHeight: '100dvh', background: C.dark,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
  }}>
    <div style={{
      width: 56, height: 56,
      background: 'rgba(183,255,107,0.12)',
      border: '1.5px solid rgba(183,255,107,0.3)',
      borderRadius: 18,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
    }}>
      <Zap size={26} color={C.green} fill={C.green} />
    </div>
    <div style={{
      width: 32, height: 32,
      border: '3px solid rgba(183,255,107,0.15)',
      borderTop: `3px solid ${C.green}`,
      borderRadius: '50%',
      animation: 'spin 0.9s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ marginTop: 16, fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
      Chargement...
    </p>
  </div>
);

const AuthWrapper = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <AuthPage />;
  return children;
};

export default AuthWrapper;