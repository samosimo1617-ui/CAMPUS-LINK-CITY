// src/ApplicationModal.jsx
// ─────────────────────────────────────────────────────────
//  Modal de candidature réutilisable — Jobs & Stages
//  Envoie via EmailJS à samosimo1617@gmail.com
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle, Upload, FileText, Check, User, Mail, Phone, MessageSquare, Loader } from 'lucide-react';
import { sendApplication } from './emailService';

const C = {
  dark:   '#0B0F19',
  panel:  'rgba(14,18,30,0.98)',
  green:  '#B7FF6B',
  greenD: '#7BC041',
  border: 'rgba(255,255,255,0.08)',
  muted:  'rgba(255,255,255,0.35)',
  faint:  'rgba(255,255,255,0.06)',
  error:  '#FF6B6B',
};

const css = `
@keyframes modalIn  { from { opacity:0; transform:scale(0.94) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes successBounce { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes glowPulse{ 0%,100%{ box-shadow:0 0 20px rgba(183,255,107,0.2); } 50%{ box-shadow:0 0 40px rgba(183,255,107,0.45); } }
`;

// ── Champ texte interne ───────────────────────────────────
const FormField = ({ icon: Icon, label, type = 'text', placeholder, value, onChange, error, multiline = false }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>{label}</label>
    <div style={{
      display: 'flex', alignItems: multiline ? 'flex-start' : 'center', gap: 10,
      background: error ? 'rgba(255,107,107,0.05)' : C.faint,
      border: `1.5px solid ${error ? 'rgba(255,107,107,0.35)' : C.border}`,
      borderRadius: 16, padding: multiline ? '12px 14px' : '13px 14px',
      transition: 'border-color 0.2s',
    }}>
      <Icon size={15} color={error ? C.error : C.muted} style={{ marginTop: multiline ? 2 : 0, flexShrink: 0 }} />
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={3}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
      )}
    </div>
    {error && (
      <p style={{ margin: '5px 0 0 4px', fontSize: 11, color: C.error, display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertCircle size={10} />{error}
      </p>
    )}
  </div>
);

// ── Modal principale ──────────────────────────────────────
const ApplicationModal = ({ item, type, onClose }) => {
  // type: 'job' | 'stage'
  const [form, setForm]     = useState({ name: '', email: '', phone: '', message: '', cvName: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errMsg, setErrMsg] = useState('');

  // Bloquer le scroll du fond quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name    = 'Nom requis';
    if (!form.email.includes('@'))  e.email   = 'Email invalide';
    if (!form.phone.trim())         e.phone   = 'Téléphone requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setStatus('sending');
    setErrMsg('');
    try {
      await sendApplication({
        from_name:  form.name,
        from_email: form.email,
        phone:      form.phone,
        company:    item.company,
        position:   item.title,
        message:    form.message || 'Pas de message.',
        type:       type === 'job' ? 'Emploi Part-Time' : 'Stage',
        cv_name:    form.cvName || 'Non fourni',
      });
      setStatus('success');
    } catch (err) {
      console.error('EmailJS error:', err);
      setErrMsg("L'envoi a échoué. Vérifiez votre configuration EmailJS.");
      setStatus('error');
    }
  };

  // ── Écran succès ────────────────────────────────────────
  if (status === 'success') return (
    <>
      <style>{css}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }}>
        <div style={{ background: C.panel, border: `1px solid rgba(183,255,107,0.2)`, borderRadius: 36, padding: '48px 32px', textAlign: 'center', maxWidth: 360, width: '100%', animation: 'modalIn 0.35s ease' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(183,255,107,0.1)', border: `2px solid ${C.green}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'successBounce 0.5s ease' }}>
            <CheckCircle size={36} color={C.green} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: -0.5, fontFamily: "'Syne', sans-serif" }}>
            Candidature Envoyée !
          </h3>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: C.muted }}>
            Votre dossier a été transmis à <strong style={{ color: 'white' }}>{item.company}</strong>
          </p>
          <p style={{ margin: '0 0 28px', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Confirmation envoyée à <span style={{ color: C.green }}>{form.email}</span>
          </p>
          <button onClick={onClose} style={{ padding: '14px 36px', background: C.green, borderRadius: 20, color: 'black', fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
            Fermer
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease' }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: '36px 36px 0 0',
        padding: '28px 20px 36px',
        maxHeight: '92dvh',
        overflowY: 'auto',
        animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, margin: '0 auto 24px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, background: item.color, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: 'white', flexShrink: 0 }}>
              {item.letter}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'white' }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{item.company} · {type === 'job' ? `${item.pay} DH/h` : item.duration}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
            <X size={16} />
          </button>
        </div>

        {/* Badge type */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(183,255,107,0.08)', border: '1px solid rgba(183,255,107,0.2)', borderRadius: 20, padding: '5px 12px', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, background: C.green, borderRadius: '50%' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: C.green, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {type === 'job' ? 'Candidature Emploi' : 'Candidature Stage'}
          </span>
        </div>

        {/* Formulaire */}
        <FormField icon={User}         label="Nom complet *"  placeholder="Mohammed Alami"      value={form.name}    onChange={set('name')}    error={errors.name} />
        <FormField icon={Mail}         label="Email *"        type="email"  placeholder="m.alami@uemf.ma" value={form.email}   onChange={set('email')}   error={errors.email} />
        <FormField icon={Phone}        label="Téléphone *"    type="tel"    placeholder="06 XX XX XX XX"  value={form.phone}   onChange={set('phone')}   error={errors.phone} />
        <FormField icon={MessageSquare} label="Message (optionnel)" placeholder="Présentez-vous brièvement..." value={form.message} onChange={set('message')} multiline />

        {/* Upload CV simulé */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>CV / Lettre de motivation</label>
          <div
            onClick={() => setForm(p => ({ ...p, cvName: p.cvName ? '' : `CV_${form.name.replace(' ', '_') || 'UEMF'}_2025.pdf` }))}
            style={{ padding: '16px', background: form.cvName ? 'rgba(183,255,107,0.06)' : C.faint, border: `1.5px dashed ${form.cvName ? C.green : C.border}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
          >
            {form.cvName ? (
              <><FileText size={16} color={C.green} /><span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{form.cvName}</span><Check size={14} color={C.green} /></>
            ) : (
              <><Upload size={16} color={C.muted} /><span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Joindre un CV (PDF)</span></>
            )}
          </div>
        </div>

        {/* Erreur envoi */}
        {status === 'error' && (
          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, marginBottom: 16, animation: 'fadeIn 0.3s ease' }}>
            <AlertCircle size={15} color={C.error} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.error, fontWeight: 600 }}>{errMsg}</p>
          </div>
        )}

        {/* Bouton envoi */}
        <button
          onClick={handleSend}
          disabled={status === 'sending'}
          style={{
            width: '100%', padding: '18px 0',
            background: status === 'sending' ? 'rgba(183,255,107,0.4)' : C.green,
            borderRadius: 24, color: 'black', fontWeight: 900, fontSize: 13,
            letterSpacing: 2, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.3s',
            animation: status !== 'sending' ? 'glowPulse 3s ease infinite' : 'none',
          }}
        >
          {status === 'sending' ? (
            <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(0,0,0,0.3)', borderTop: '2.5px solid black', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Envoi en cours...</>
          ) : (
            <><Send size={16} /> Envoyer ma candidature</>
          )}
        </button>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Envoyé à samosimo1617@gmail.com via EmailJS
        </p>
      </div>
    </>
  );
};

export default ApplicationModal;