// src/AuthPage.jsx
// ─────────────────────────────────────────────────────────
//  Page d'authentification — Login + Inscription
//  Style : Dark #0B0F19, Vert néon #B7FF6B
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from './firebase';

// ── Palette ──────────────────────────────────────────────
const C = {
  dark:   '#0B0F19',
  panel:  'rgba(18,23,35,0.97)',
  green:  '#B7FF6B',
  greenD: '#7BC041',
  border: 'rgba(255,255,255,0.08)',
  muted:  'rgba(255,255,255,0.35)',
  faint:  'rgba(255,255,255,0.06)',
  error:  '#FF6B6B',
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

@keyframes slideUp   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes glowPulse { 0%,100%{ box-shadow: 0 0 20px rgba(183,255,107,0.2); } 50%{ box-shadow: 0 0 40px rgba(183,255,107,0.5); } }
@keyframes spin      { to { transform: rotate(360deg); } }
@keyframes float     { 0%,100%{ transform: translateY(0px); } 50%{ transform: translateY(-12px); } }

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
::-webkit-scrollbar { width: 0; }
input { outline: none; font-family: 'DM Sans', sans-serif; }
button { cursor: pointer; border: none; font-family: 'Syne', sans-serif; }
`;

// ── Composant champ de saisie ─────────────────────────────
const Field = ({ icon: Icon, type, placeholder, value, onChange, error, rightEl }) => (
  <div style={{ marginBottom: 14, position: 'relative' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: error ? 'rgba(255,107,107,0.06)' : C.faint,
      border: `1.5px solid ${error ? 'rgba(255,107,107,0.4)' : C.border}`,
      borderRadius: 18, padding: '14px 16px',
      transition: 'border-color 0.2s',
    }}
      onFocus={() => {}} // handled by input
    >
      <Icon size={17} color={error ? C.error : C.muted} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: 'white', fontSize: 14, fontWeight: 500,
        }}
      />
      {rightEl}
    </div>
    {error && (
      <p style={{ margin: '6px 0 0 4px', fontSize: 11, color: C.error, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, animation: 'fadeIn 0.2s ease' }}>
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ── Composant principal ───────────────────────────────────
const AuthPage = () => {
  const [mode, setMode]           = useState('login'); // 'login' | 'register'
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [showCfm, setShowCfm]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [fireErr, setFireErr]     = useState('');

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (mode === 'register' && !name.trim())  e.name     = 'Nom requis';
    if (!email.includes('@'))                 e.email    = 'Email invalide';
    if (password.length < 6)                  e.password = 'Minimum 6 caractères';
    if (mode === 'register' && password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    setFireErr('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        setSuccess(true);
      }
    } catch (err) {
      const msg = {
        'auth/user-not-found':    'Aucun compte avec cet email.',
        'auth/wrong-password':    'Mot de passe incorrect.',
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email':     'Format email invalide.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
        'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      }[err.code] || 'Une erreur est survenue. Veuillez réessayer.';
      setFireErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Écran succès inscription ──────────────────────────
  if (success) return (
    <div style={{ minHeight: '100dvh', background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{css}</style>
      <div style={{ textAlign: 'center', padding: 32, animation: 'slideUp 0.5s ease' }}>
        <div style={{ width: 88, height: 88, background: 'rgba(183,255,107,0.12)', border: `2px solid ${C.green}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'glowPulse 2s ease infinite' }}>
          <CheckCircle size={40} color={C.green} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: 'white', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: -1 }}>
          Compte créé !
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.muted }}>Bienvenue sur CampusLink, <strong style={{ color: C.green }}>{name}</strong> !</p>
        <button onClick={() => { setSuccess(false); setMode('login'); }}
          style={{ padding: '14px 32px', background: C.green, borderRadius: 18, color: 'black', fontWeight: 900, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
          Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: C.dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{css}</style>

      {/* Fond décoratif */}
      <div style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(183,255,107,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(183,255,107,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(183,255,107,0.12)', border: `1.5px solid rgba(183,255,107,0.3)`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 4s ease-in-out infinite' }}>
          <Zap size={26} color={C.green} fill={C.green} />
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1, color: 'white', fontFamily: "'Syne', sans-serif" }}>
          Campus<span style={{ color: C.green }}>Link</span>
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>UEMF Edition</p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 32, padding: '32px 28px', animation: 'slideUp 0.5s ease 0.1s both' }}>

        {/* Onglets mode */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 4 }}>
          {[['login', 'Connexion'], ['register', 'Inscription']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setErrors({}); setFireErr(''); }}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: mode === m ? C.green : 'transparent', color: mode === m ? 'black' : C.muted, fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.25s ease' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Titre */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'white', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: -0.5 }}>
            {mode === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {mode === 'login' ? 'Connectez-vous à votre espace UEMF' : 'Rejoignez la communauté CampusLink'}
          </p>
        </div>

        {/* Champs */}
        {mode === 'register' && (
          <Field icon={User} type="text" placeholder="Nom complet"
            value={name} onChange={e => setName(e.target.value)} error={errors.name} />
        )}
        <Field icon={Mail} type="email" placeholder="Email (@uemf.ma ou autre)"
          value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
        <Field icon={Lock} type={showPwd ? 'text' : 'password'} placeholder="Mot de passe"
          value={password} onChange={e => setPassword(e.target.value)} error={errors.password}
          rightEl={
            <button onClick={() => setShowPwd(p => !p)} style={{ background: 'none', color: C.muted, padding: 0 }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          } />
        {mode === 'register' && (
          <Field icon={Lock} type={showCfm ? 'text' : 'password'} placeholder="Confirmer le mot de passe"
            value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm}
            rightEl={
              <button onClick={() => setShowCfm(p => !p)} style={{ background: 'none', color: C.muted, padding: 0 }}>
                {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            } />
        )}

        {/* Erreur Firebase */}
        {fireErr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 14, marginBottom: 16, animation: 'fadeIn 0.3s ease' }}>
            <AlertCircle size={15} color={C.error} />
            <p style={{ margin: 0, fontSize: 13, color: C.error, fontWeight: 600 }}>{fireErr}</p>
          </div>
        )}

        {/* Bouton submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '18px 0', borderRadius: 22, background: loading ? 'rgba(183,255,107,0.4)' : C.green, color: 'black', fontWeight: 900, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, transition: 'all 0.3s', animation: 'glowPulse 3s ease infinite' }}>
          {loading ? (
            <div style={{ width: 20, height: 20, border: '2.5px solid rgba(0,0,0,0.3)', borderTop: '2.5px solid black', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>{mode === 'login' ? 'Se connecter' : "S'inscrire"}<ArrowRight size={16} /></>
          )}
        </button>

        {/* Mot de passe oublié */}
        {mode === 'login' && (
          <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 12, color: C.muted }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
              onClick={() => setFireErr('Réinitialisation : fonctionnalité à connecter dans Firebase.')}>
              Mot de passe oublié ?
            </span>
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
        CampusLink © 2025 — UEMF Fès
      </p>
    </div>
  );
};

export default AuthPage;