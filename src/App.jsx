// ══════════════════════════════════════════════════════════
//  CampusLink — App.jsx  (Full-Stack Version)
//  Firebase Auth + Firestore + EmailJS + Framer Motion
// ══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';

// Firebase
import { auth, db, googleProvider } from './firebase';
import {
  onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, where
} from 'firebase/firestore';

// Icons
import {
  Car, ArrowLeft, MapPin, Plus, Minus, Star, Phone, MessageCircle,
  Shield, ChevronDown, CheckCircle, Zap, Users, Briefcase,
  GraduationCap, Home, Bell, User, Send, Navigation2, Eye,
  Heart, Bed, Wifi, Building2, SlidersHorizontal, Search, Check,
  ToggleRight, X, FileText, Upload, AlertCircle, LogOut,
  History, BarChart3, Mail, Lock, Chrome
} from 'lucide-react';

// ─────────────────────────────────────────────
//  FIX LEAFLET
// ─────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─────────────────────────────────────────────
//  EmailJS — Remplace par tes vraies clés
//  https://www.emailjs.com/docs/
// ─────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ex: service_abc123
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ex: template_xyz456
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ex: user_xxxxxxxxxx
const CONTACT_EMAIL       = 'samosimo1617@gmail.com';

emailjs.init(EMAILJS_PUBLIC_KEY);

// ─────────────────────────────────────────────
//  COULEURS
// ─────────────────────────────────────────────
const C = {
  dark:  '#0B0F19',
  panel: 'rgba(18,23,35,0.97)',
  green: '#B7FF6B',
  greenD:'#7BC041',
  border:'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.35)',
  faint: 'rgba(255,255,255,0.06)',
};
const OSM = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

// ─────────────────────────────────────────────
//  DONNÉES STATIQUES
// ─────────────────────────────────────────────
const DESTINATIONS = [
  { name:'Gare de Fès',           distance:'8.2 km',  time:'18 min', price:30, coords:[34.0236,-5.0009] },
  { name:'Médina — Bab Boujloud', distance:'9.1 km',  time:'22 min', price:35, coords:[34.0636,-4.9773] },
  { name:'Borj Fès — Carrefour',  distance:'6.4 km',  time:'14 min', price:25, coords:[34.0089,-5.0106] },
  { name:'Aéroport Fès-Saïs',     distance:'14.5 km', time:'28 min', price:55, coords:[33.9272,-4.9779] },
  { name:'Hôpital Ibn Al Khatib', distance:'7.8 km',  time:'17 min', price:28, coords:[34.0052,-4.9990] },
  { name:'Faculté des Sciences',  distance:'5.1 km',  time:'11 min', price:20, coords:[34.0433,-5.0453] },
  { name:'Atlas Mall',            distance:'4.2 km',  time:'10 min', price:18, coords:[34.0180,-5.0250] },
  { name:'Place Florence',        distance:'10.3 km', time:'24 min', price:38, coords:[34.0354,-4.9998] },
];

const DRIVERS = [
  { id:1, name:'Youssef El Idrissi', rating:4.9, trips:1240, car:'Dacia Logan • Blanche',  plate:'A-45821-FES', avatar:'Y', delta:0,  eta:'3 min', verified:true  },
  { id:2, name:'Hamza Benali',       rating:4.7, trips:876,  car:'Renault Clio • Grise',   plate:'B-12043-FES', avatar:'H', delta:+5, eta:'5 min', verified:true  },
  { id:3, name:'Mehdi Tazi',         rating:4.8, trips:2103, car:'Hyundai i10 • Noire',    plate:'C-78234-FES', avatar:'M', delta:-5, eta:'2 min', verified:false },
  { id:4, name:'Omar Fassi',         rating:4.6, trips:531,  car:'Peugeot 208 • Bleue',    plate:'D-33102-FES', avatar:'O', delta:+3, eta:'4 min', verified:true  },
];

const RIDE_REQUESTS = [
  { id:1, passenger:'Salma K.',   from:'Campus UEMF',        to:'Gare de Fès',         dist:'8.2 km',  driverDist:'1.2 km', price:30, time:'18 min', avatar:'S' },
  { id:2, passenger:'Amine R.',   from:'Narjiss Résidence',  to:'Médina Bab Boujloud', dist:'9.1 km',  driverDist:'0.8 km', price:35, time:'22 min', avatar:'A' },
  { id:3, passenger:'Nour B.',    from:'Faculté UEMF',       to:'Atlas Mall',          dist:'4.2 km',  driverDist:'2.1 km', price:18, time:'10 min', avatar:'N' },
  { id:4, passenger:'Yassine M.', from:'Résidence Imouzzer', to:'Place Florence',      dist:'10.3 km', driverDist:'0.5 km', price:38, time:'24 min', avatar:'Y' },
];

const JOBS = [
  { id:1, company:'Decathlon',    color:'#0082C3', letter:'D', title:'Vendeur Sportif',    pay:16, hours:'15-20h/sem', type:'Weekend',  location:'Fès Atlas',  tags:['Sport','Vente'],    desc:'Conseiller les clients dans le rayon sport. Formation assurée.' },
  { id:2, company:'Defacto',      color:'#E63946', letter:'D', title:'Conseiller Mode',    pay:14, hours:'10-15h/sem', type:'Flexible', location:'Borj Fès',   tags:['Mode','Caisse'],    desc:'Accueil clients, mise en rayon, caisse. Horaires adaptés.' },
  { id:3, company:'Carrefour',    color:'#F4A600', letter:'C', title:'Hôte de Caisse',     pay:13, hours:'12h/sem',    type:'Matin',    location:'Rte Sefrou', tags:['Caisse','Stable'],   desc:'Gestion caisse rapide. Poste stable pour étudiants.' },
  { id:4, company:'Zara',         color:'#1D1D1B', letter:'Z', title:'Assistant Vendeur',  pay:15, hours:'20h/sem',    type:'Weekend',  location:'Borj Fès',   tags:['Mode','Premium'],   desc:'Accueil et conseil clientèle chez une enseigne internationale.' },
  { id:5, company:'Café Clock',   color:'#8B5CF6', letter:'C', title:'Barista / Serveur',  pay:12, hours:'15h/sem',    type:'Soir',     location:'Médina Fès', tags:['Resto','Tips'],      desc:'Service en salle et bar. Pourboires inclus.' },
  { id:6, company:'Orange Maroc', color:'#FF6600', letter:'O', title:'Animateur Boutique', pay:18, hours:'20h/sem',    type:'Flexible', location:'Centre Fès', tags:['Telecom','Comm'],    desc:'Présenter les offres Orange et accueillir les clients.' },
];

const STAGES = [
  { id:1, company:'OCP Group',         color:'#00843D', letter:'O', title:'Stage PFE — Data Science',   domain:'Informatique', duration:'4-6 mois', type:'PFE', level:'Bac+4/5', location:'Casablanca', desc:"Modèles ML pour l'analyse de production. Python, TensorFlow, SQL.", tags:['Data','Python','ML'] },
  { id:2, company:'Attijariwafa Bank', color:'#E2001A', letter:'A', title:'Stage Finance & BI',          domain:'Finance',      duration:'3 mois',   type:'Été', level:'Bac+3',   location:'Fès',        desc:'Analyse financière, reporting BI, Power BI.', tags:['Finance','BI','Excel'] },
  { id:3, company:'Inwi',              color:'#9B1BCC', letter:'I', title:'Stage Développement Web',     domain:'Informatique', duration:'2-3 mois', type:'Été', level:'Bac+2/3', location:'Rabat',      desc:'React.js et Node.js pour interfaces internes.', tags:['React','Node','Web'] },
  { id:4, company:'BMCE Bank',         color:'#005FAD', letter:'B', title:'Stage Analyse Crédit',        domain:'Finance',      duration:'3 mois',   type:'PFE', level:'Bac+5',   location:'Fès',        desc:"Scoring client, rapport de fin d'études.", tags:['Crédit','Banque'] },
  { id:5, company:'Marsa Maroc',       color:'#00A0D1', letter:'M', title:'Stage Logistique & Supply',   domain:'Logistique',   duration:'3-4 mois', type:'PFE', level:'Bac+4',   location:'Casablanca', desc:'Flux logistiques, gestion des stocks, SAP.', tags:['Logistique','SAP'] },
  { id:6, company:'Lydec',             color:'#F7A800', letter:'L', title:'Stage Génie Civil / Énergie', domain:'Ingénierie',   duration:'2 mois',   type:'Été', level:'Bac+2',   location:'Fès',        desc:'Suivi chantiers, AutoCAD, rapports techniques.', tags:['Civil','AutoCAD'] },
];

const LOGEMENTS = [
  { id:1, title:'Studio Moderne Narjiss',    price:1800, type:'Studio', size:'32m²', coords:[33.9870,-4.9830], img:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500', amenities:['Wifi','Meublé','Clim'],    rating:4.8, reviews:24, landlord:'Mohammed A.', verified:true,  desc:"Studio tout équipé à 5 min du campus UEMF." },
  { id:2, title:'Coloc Imouzzer 2 Chambres', price:1200, type:'Coloc',  size:'65m²', coords:[33.9950,-4.9900], img:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500', amenities:['Wifi','Meublé','Parking'], rating:4.6, reviews:18, landlord:'Fatima Z.',   verified:true,  desc:"2 chambres indépendantes, salon commun." },
  { id:3, title:'Studio Luxe Borj Fès',      price:2500, type:'Studio', size:'45m²', coords:[34.0050,-4.9980], img:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500', amenities:['Wifi','Piscine','Sécurité'],rating:4.9, reviews:41, landlord:'Karim B.',    verified:true,  desc:"Studio haut standing résidence sécurisée." },
  { id:4, title:'Chambre Meublée Narjiss',   price: 900, type:'Chambre',size:'18m²', coords:[33.9820,-4.9850], img:'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500', amenities:['Wifi','Meublé'],           rating:4.4, reviews:9,  landlord:'Aicha M.',    verified:false, desc:"Chambre simple, idéale pour budget serré." },
  { id:5, title:'Appart F2 Route Imouzzer',  price:2200, type:'F2',     size:'55m²', coords:[34.0020,-5.0050], img:'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500', amenities:['Wifi','Parking','Balcon'], rating:4.7, reviews:15, landlord:'Hassan T.',   verified:true,  desc:"F2 refait à neuf, balcon, proche campus." },
];

const DAYS  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const SLOTS = ['8h-10h','10h-12h','12h-14h','14h-16h','16h-18h','18h-20h'];

// ─────────────────────────────────────────────
//  AUTH CONTEXT
// ─────────────────────────────────────────────
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginGoogle = () => signInWithPopup(auth, googleProvider);

  const loginEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const registerEmail = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, loginEmail, registerEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ─────────────────────────────────────────────
//  AUTH GUARD — redirige vers /login si pas connecté
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────
const css = `
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
  * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
  ::-webkit-scrollbar { width:0; height:0; }
  input,textarea { outline:none; }
  button { cursor:pointer; border:none; }
`;

const MapFly = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration:1.4 }); }, [center, map]);
  return null;
};

const routeIcon = (color) => L.divIcon({
  html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className:'', iconAnchor:[6,6],
});

const priceIcon = (label) => L.divIcon({
  html: `<div style="background:#0B0F19;color:#B7FF6B;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:900;border:1.5px solid #B7FF6B;font-family:Inter,sans-serif;white-space:nowrap">${label}</div>`,
  className:'', iconAnchor:[30,14],
});

// ── Spinner global ──
const Loader = () => (
  <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:C.dark }}>
    <div style={{ width:48, height:48, border:`3px solid ${C.faint}`, borderTop:`3px solid ${C.green}`, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
  </div>
);

// ── Toast ──
const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type='info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const bg = { success:'#10B981', error:'#EF4444', info:'#3B82F6', warning:'#F59E0B' };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              style={{ background:bg[t.type], color:'white', padding:'12px 20px', borderRadius:16, fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 32px rgba(0,0,0,0.3)', whiteSpace:'nowrap' }}>
              {t.type==='success' && <CheckCircle size={16}/>}
              {t.type==='error'   && <AlertCircle size={16}/>}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

// ══════════════════════════════════════════════════════════
//  PAGE LOGIN
// ══════════════════════════════════════════════════════════
const LoginPage = () => {
  const { loginGoogle, loginEmail, registerEmail } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const [mode, setMode]       = useState('login'); // login | register
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginGoogle();
      toast('Connexion réussie ! 🎉', 'success');
      navigate('/');
    } catch (e) {
      toast('Erreur Google : ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const handleEmail = async () => {
    if (!email || !password) { toast('Remplis tous les champs', 'error'); return; }
    try {
      setLoading(true);
      if (mode === 'login') {
        await loginEmail(email, password);
        toast('Bienvenue ! 🎉', 'success');
      } else {
        await registerEmail(email, password);
        toast('Compte créé avec succès !', 'success');
      }
      navigate('/');
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' ? 'Mot de passe incorrect'
                : e.code === 'auth/user-not-found'  ? 'Email introuvable'
                : e.code === 'auth/email-already-in-use' ? 'Email déjà utilisé'
                : e.message;
      toast(msg, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100dvh', background:C.dark, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Inter',sans-serif" }}>
      <style>{css}</style>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        style={{ width:'100%', maxWidth:380, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:32, padding:32 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, background:'rgba(183,255,107,0.15)', border:`1.5px solid rgba(183,255,107,0.3)`, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Zap size={28} color={C.green} fill={C.green}/>
          </div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'white', letterSpacing:-1 }}>
            Campus<span style={{ color:C.green }}>Link</span>
          </h1>
          <p style={{ margin:'6px 0 0', fontSize:12, color:C.muted, fontWeight:600, letterSpacing:1.5, textTransform:'uppercase' }}>UEMF Edition</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:C.faint, borderRadius:14, padding:4, marginBottom:24 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex:1, padding:'10px 0', borderRadius:11, background: mode===m ? C.green : 'transparent', color: mode===m ? 'black' : C.muted, fontWeight:800, fontSize:12, letterSpacing:1, textTransform:'uppercase', transition:'all 0.2s' }}>
              {m==='login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Email UEMF</label>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 14px' }}>
            <Mail size={16} color={C.muted}/>
            <input type="email" placeholder="m.alami@uemf.ma" value={email} onChange={e => setEmail(e.target.value)}
              style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:14, fontWeight:500 }}/>
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Mot de passe</label>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 14px' }}>
            <Lock size={16} color={C.muted}/>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key==='Enter' && handleEmail()}
              style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:14, fontWeight:500 }}/>
          </div>
        </div>

        {/* Bouton email */}
        <button onClick={handleEmail} disabled={loading}
          style={{ width:'100%', padding:'18px 0', background: loading ? 'rgba(183,255,107,0.4)' : C.green, color:'black', borderRadius:20, fontWeight:900, fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
          {loading
            ? <div style={{ width:20, height:20, border:'2px solid rgba(0,0,0,0.2)', borderTop:'2px solid black', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
            : <>{mode==='login' ? 'Se connecter' : 'Créer mon compte'}</>
          }
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, height:1, background:C.border }}/>
          <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>ou</span>
          <div style={{ flex:1, height:1, background:C.border }}/>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', padding:'16px 0', background:C.faint, border:`1px solid ${C.border}`, color:'white', borderRadius:20, fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Chrome size={18}/> Continuer avec Google
        </button>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MODULE 1A : GORIDE PASSAGER
// ══════════════════════════════════════════════════════════
const GoRidePassager = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { user } = useAuth();

  const [step, setStep]             = useState('booking');
  const [destination, setDestination] = useState(null);
  const [showDest, setShowDest]     = useState(false);
  const [search, setSearch]         = useState('');
  const [price, setPrice]           = useState(25);
  const [offers, setOffers]         = useState([]);
  const [driver, setDriver]         = useState(null);
  const [mapCenter, setMapCenter]   = useState([33.98,-4.99]);
  const [driverProgress, setDriverProgress] = useState(0);
  const [showCounterOffer, setShowCounterOffer] = useState(null);
  const [counterAmount, setCounterAmount]       = useState(0);
  const [rideHistory, setRideHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [chatMsg, setChatMsg]       = useState('');
  const [chatMsgs, setChatMsgs]     = useState([]);
  const [saving, setSaving]         = useState(false);

  const pickupCoords = [33.98,-4.99];
  const filtered = DESTINATIONS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  // Charger historique depuis Firestore
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(db,'rides'), where('userId','==',user.uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        setRideHistory(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      } catch(e) { console.error('Firestore load rides:', e); }
    };
    load();
  }, [user]);

  const startSearch = () => {
    if (!destination) return;
    setStep('searching'); setOffers([]);
    DRIVERS.forEach((d,i) => setTimeout(() => setOffers(prev => [...prev, { ...d, proposed: price+d.delta }]), (i+1)*1800));
  };

  const acceptDriver = (d) => {
    setDriver(d); setStep('found'); setDriverProgress(0);
    const iv = setInterval(() => setDriverProgress(p => { if(p>=100){clearInterval(iv);return 100;} return p+2; }), 400);
  };

  const sendCounter = (driverOffer) => {
    if (counterAmount < 10) { toast('Prix trop bas !', 'error'); return; }
    setTimeout(() => {
      if (Math.random() > 0.3) {
        setDriver({ ...driverOffer, proposed: counterAmount });
        setStep('found');
        toast(`✅ ${driverOffer.name} a accepté ${counterAmount} DH !`, 'success');
      } else {
        toast('❌ Le chauffeur a refusé votre offre', 'error');
      }
      setShowCounterOffer(null);
    }, 1500);
  };

  // Sauvegarder course dans Firestore
  const saveRideToFirestore = async (rating) => {
    if (!user || !driver || !destination) return;
    setSaving(true);
    try {
      const rideData = {
        userId:      user.uid,
        userEmail:   user.email,
        driver:      driver.name,
        destination: destination.name,
        price:       driver.proposed,
        rating,
        createdAt:   serverTimestamp(),
      };
      const docRef = await addDoc(collection(db,'rides'), rideData);
      setRideHistory(prev => [{ id:docRef.id, ...rideData, createdAt: new Date() }, ...prev]);
      toast(`Trajet enregistré ! ⭐ Merci`, 'success');
    } catch(e) {
      toast('Erreur sauvegarde : ' + e.message, 'error');
    } finally {
      setSaving(false);
      setStep('booking'); setDriver(null); setDestination(null);
    }
  };

  const cancel = () => { setStep('booking'); setOffers([]); setDriver(null); toast('Course annulée', 'info'); };

  const sendChatMessage = () => {
    if (!chatMsg.trim()) return;
    setChatMsgs(prev => [...prev, { id:Date.now(), sender:'user', text:chatMsg, time:new Date().toLocaleTimeString() }]);
    setChatMsg('');
    setTimeout(() => {
      const responses = ["D'accord, j'arrive !", "Je suis devant l'entrée.", "Pas de problème, je vous attends."];
      setChatMsgs(prev => [...prev, { id:Date.now()+1, sender:'driver', text:responses[Math.floor(Math.random()*responses.length)], time:new Date().toLocaleTimeString() }]);
    }, 1500);
  };

  return (
    <div style={{ height:'100dvh', width:'100%', background:C.dark, position:'relative', overflow:'hidden', fontFamily:"'Inter',sans-serif", color:'white' }}>
      <style>{css}</style>

      {/* CARTE */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height:'100%', width:'100%' }} zoomControl attributionControl>
          <TileLayer attribution='&copy; OpenStreetMap' url={OSM}/>
          <MapFly center={destination ? destination.coords : mapCenter}/>
          <Marker position={pickupCoords} icon={routeIcon(C.green)}><Popup>Campus UEMF</Popup></Marker>
          {destination && <>
            <Marker position={destination.coords} icon={routeIcon('#EF4444')}><Popup>{destination.name}</Popup></Marker>
            <Polyline positions={[pickupCoords, destination.coords]} color={C.green} weight={5} opacity={0.7} dashArray="8,8"/>
          </>}
        </MapContainer>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'60%', background:'linear-gradient(to top,#0B0F19 55%,transparent)', pointerEvents:'none' }}/>
      </div>

      {/* TOP BAR */}
      <div style={{ position:'absolute', top:20, left:20, right:20, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/')} style={{ width:48, height:48, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
          <ArrowLeft size={22}/>
        </button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ width:48, height:48, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:C.green }}>
            <History size={20}/>
          </button>
          <div style={{ background:C.green, color:'black', padding:'8px 16px', borderRadius:20, fontWeight:900, fontSize:10, letterSpacing:2, textTransform:'uppercase', fontStyle:'italic', display:'flex', alignItems:'center' }}>
            UEMF RIDE
          </div>
        </div>
        <button onClick={() => navigate('/goride/chauffeur')} style={{ width:48, height:48, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:2, color:C.green }}>
          <Car size={16}/><span style={{ fontSize:9, fontWeight:700 }}>Drive</span>
        </button>
      </div>

      {/* HISTORIQUE FIRESTORE */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ position:'absolute', top:80, left:20, right:20, zIndex:101, background:C.panel, border:`1px solid ${C.border}`, borderRadius:24, padding:20, maxHeight:'55vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:900, textTransform:'uppercase', fontStyle:'italic' }}>Mes Courses</h3>
              <button onClick={() => setShowHistory(false)} style={{ background:C.faint, borderRadius:10, padding:'6px 8px', color:C.muted }}><X size={14}/></button>
            </div>
            {rideHistory.length === 0
              ? <p style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'16px 0' }}>Aucune course enregistrée</p>
              : rideHistory.map((r,i) => (
                <div key={r.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:38, height:38, background:'rgba(183,255,107,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:C.green, fontSize:14 }}>{(r.driver||'?')[0]}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{r.destination}</p>
                    <p style={{ margin:0, fontSize:11, color:C.muted }}>{r.driver}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:900, color:C.green }}>{r.price} DH</p>
                    <p style={{ margin:0, fontSize:11 }}>{'⭐'.repeat(r.rating||0)}</p>
                  </div>
                </div>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOOKING */}
      {step === 'booking' && (
        <motion.div initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:28 }}>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontSize:24, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', letterSpacing:-1, margin:0 }}>Go<span style={{ color:C.green }}>Ride</span></h2>
              <p style={{ margin:'4px 0 0', fontSize:11, color:C.muted, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>Négociez votre prix</p>
            </div>

            {/* Itinéraire */}
            <div style={{ position:'relative', marginBottom:20 }}>
              <div style={{ position:'absolute', left:21, top:32, bottom:32, width:2, background:`linear-gradient(to bottom,${C.green},rgba(255,255,255,0.1))` }}/>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:C.faint, borderRadius:16, marginBottom:8 }}>
                <div style={{ width:10, height:10, background:C.green, borderRadius:'50%', flexShrink:0, marginLeft:10 }}/>
                <div>
                  <p style={{ margin:0, fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Départ</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:700 }}>Campus UEMF, Fès-Narjiss</p>
                </div>
              </div>
              <div onClick={() => setShowDest(!showDest)} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background: destination ? 'rgba(183,255,107,0.08)' : C.faint, border: destination ? '1px solid rgba(183,255,107,0.25)' : '1px solid transparent', borderRadius:16, cursor:'pointer' }}>
                <div style={{ width:10, height:10, background: destination ? C.green : 'rgba(255,255,255,0.2)', borderRadius:'50%', flexShrink:0, marginLeft:10, border: destination ? 'none' : '2px solid rgba(255,255,255,0.3)' }}/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:10, color: destination ? C.green : C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Destination</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color: destination ? 'white' : 'rgba(255,255,255,0.4)' }}>
                    {destination ? destination.name : 'Où allez-vous ?'}
                  </p>
                </div>
                {destination && <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{destination.distance}</span>}
                <ChevronDown size={16} color="rgba(255,255,255,0.3)"/>
              </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showDest && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                  style={{ background:'rgba(10,14,24,0.99)', border:`1px solid ${C.border}`, borderRadius:20, padding:12, marginBottom:16, maxHeight:200, overflowY:'auto' }}>
                  <div style={{ position:'relative', marginBottom:10 }}>
                    <Search size={14} color={C.muted} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input autoFocus placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                      style={{ width:'100%', background:C.faint, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px 10px 36px', color:'white', fontSize:13 }}/>
                  </div>
                  {filtered.map((d,i) => (
                    <div key={i} onClick={() => { setDestination(d); setMapCenter(d.coords); setShowDest(false); setSearch(''); setPrice(d.price); }}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(183,255,107,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <MapPin size={14} color={C.green}/>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{d.name}</p>
                        <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.35)' }}>{d.distance} • {d.time}</p>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:C.green }}>{d.price} DH</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prix */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.35)', borderRadius:24, padding:'8px 8px', marginBottom:16, border:`1px solid ${C.border}` }}>
              <button onClick={() => setPrice(p => Math.max(10,p-5))} style={{ width:52, height:52, background:'#1E2535', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><Minus size={20}/></button>
              <div style={{ textAlign:'center' }}>
                <p style={{ margin:0, fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:800, letterSpacing:2, textTransform:'uppercase' }}>Votre offre</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, justifyContent:'center' }}>
                  <span style={{ fontSize:44, fontWeight:900, color:C.green, fontStyle:'italic', lineHeight:1 }}>{price}</span>
                  <span style={{ fontSize:18, fontWeight:900, color:C.green, fontStyle:'italic' }}>DH</span>
                </div>
                <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.2)' }}>Prix moyen : {price+5} DH</p>
              </div>
              <button onClick={() => setPrice(p => p+5)} style={{ width:52, height:52, background:C.green, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={20} color="black"/></button>
            </div>

            <motion.button whileTap={{ scale:0.97 }} onClick={startSearch} disabled={!destination}
              style={{ width:'100%', padding:'20px 0', borderRadius:28, background: destination ? C.green : 'rgba(255,255,255,0.07)', color: destination ? 'black' : 'rgba(255,255,255,0.2)', fontWeight:900, fontSize:13, letterSpacing:3, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <Car size={18} fill={destination?'black':'rgba(255,255,255,0.2)'}/> Trouver un Chauffeur
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* SEARCHING */}
      {step === 'searching' && (
        <motion.div initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0, fontSize:16, fontWeight:900, fontStyle:'italic', textTransform:'uppercase' }}>
                  {offers.length === 0 ? 'Recherche...' : `${offers.length} Offre${offers.length>1?'s':''}`}
                </h3>
                <p style={{ margin:'4px 0 0', fontSize:11, color:C.muted }}>{destination?.name} • <span style={{ color:C.green, fontWeight:700 }}>{price} DH</span></p>
              </div>
              <button onClick={() => { setStep('booking'); setOffers([]); toast('Annulé', 'info'); }}
                style={{ background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:12, padding:'8px 14px', color:'rgba(255,100,100,0.8)', fontSize:12, fontWeight:700 }}>
                Annuler
              </button>
            </div>
            {offers.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0' }}>
                <div style={{ width:48, height:48, border:`3px solid rgba(183,255,107,0.2)`, borderTop:`3px solid ${C.green}`, borderRadius:'50%', animation:'spin 1s linear infinite', marginBottom:12 }}/>
                <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.4)' }}>Les chauffeurs reçoivent votre demande...</p>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:280, overflowY:'auto' }}>
              <AnimatePresence>
                {offers.map((d,i) => (
                  <motion.div key={d.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                    style={{ background:C.faint, border:`1px solid ${C.border}`, borderRadius:20, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:48, height:48, background:`linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:'black', flexShrink:0 }}>{d.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:800 }}>{d.name}</p>
                        {d.verified && <Shield size={12} color={C.green} fill={C.green}/>}
                      </div>
                      <p style={{ margin:'2px 0', fontSize:11, color:'rgba(255,255,255,0.4)' }}>⭐ {d.rating} • {d.car}</p>
                      <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.3)' }}>ETA : {d.eta}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ margin:0, fontSize:22, fontWeight:900, color: d.proposed<=price ? C.green : '#FF6B6B', fontStyle:'italic' }}>{d.proposed} DH</p>
                      <div style={{ display:'flex', gap:6, marginTop:6 }}>
                        <button onClick={() => acceptDriver(d)} style={{ background:C.green, color:'black', borderRadius:10, padding:'6px 12px', fontWeight:800, fontSize:10, textTransform:'uppercase' }}>Accepter</button>
                        <button onClick={() => { setShowCounterOffer(d.id); setCounterAmount(d.proposed-5); }} style={{ background:C.faint, border:`1px solid ${C.border}`, color:C.muted, borderRadius:10, padding:'6px 8px', fontWeight:700, fontSize:10 }}>Négocier</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL CONTRE-OFFRE */}
      <AnimatePresence>
        {showCounterOffer && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', inset:0, zIndex:200, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:28, padding:24, width:'100%', maxWidth:340 }}>
              <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:900, textTransform:'uppercase', fontStyle:'italic' }}>Contre-offre</h3>
              <p style={{ margin:'0 0 16px', fontSize:12, color:C.muted }}>Proposez votre prix</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:20 }}>
                <button onClick={() => setCounterAmount(c => Math.max(10,c-5))} style={{ width:44, height:44, background:C.faint, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><Minus size={18}/></button>
                <div>
                  <span style={{ fontSize:36, fontWeight:900, color:C.green, fontStyle:'italic' }}>{counterAmount}</span>
                  <span style={{ fontSize:16, fontWeight:700, color:C.green, marginLeft:4 }}>DH</span>
                </div>
                <button onClick={() => setCounterAmount(c => c+5)} style={{ width:44, height:44, background:C.green, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={18} color="black"/></button>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowCounterOffer(null)} style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:18, color:'white', fontWeight:700 }}>Annuler</button>
                <button onClick={() => sendCounter(offers.find(o => o.id===showCounterOffer))} style={{ flex:2, padding:'14px 0', background:C.green, borderRadius:18, color:'black', fontWeight:900, fontSize:12, textTransform:'uppercase' }}>Envoyer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOUND */}
      {step === 'found' && driver && (
        <motion.div initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:'1px solid rgba(183,255,107,0.2)', borderRadius:40, padding:28 }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
                  {driverProgress < 100 ? 'En approche...' : '🟢 Chauffeur arrivé !'}
                </span>
                <span style={{ fontSize:12, color:C.muted }}>{driverProgress}%</span>
              </div>
              <div style={{ height:6, background:C.faint, borderRadius:3, overflow:'hidden' }}>
                <motion.div animate={{ width:`${driverProgress}%` }} style={{ height:'100%', background:`linear-gradient(90deg,${C.green},${C.greenD})`, borderRadius:3 }}/>
              </div>
            </div>

            <div style={{ background:'rgba(183,255,107,0.06)', border:'1px solid rgba(183,255,107,0.15)', borderRadius:24, padding:18, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:64, height:64, background:`linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:24, color:'black', flexShrink:0 }}>{driver.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <p style={{ margin:0, fontSize:16, fontWeight:900 }}>{driver.name}</p>
                    {driver.verified && <Shield size={14} color={C.green} fill={C.green}/>}
                  </div>
                  <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={13} color={C.green} fill={s<=Math.floor(driver.rating)?C.green:'transparent'}/>)}
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginLeft:4 }}>{driver.rating}</span>
                  </div>
                  <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.5)' }}>{driver.car} • {driver.plate}</p>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                {[['Prix',`${driver.proposed} DH`,C.green],['Arrivée',driver.eta,'white'],['Distance',destination?.distance,'white']].map(([l,v,col],i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:18, fontWeight:900, color:col, fontStyle:'italic' }}>{v}</p>
                    <p style={{ margin:0, fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <button onClick={() => toast(`📞 Appel de ${driver.name}...`, 'info')} style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:18, color:'white', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Phone size={16}/> Appeler
              </button>
              <button onClick={() => { setShowChat(true); setChatMsgs([{ id:1, sender:'driver', text:"Bonjour, j'arrive !", time:new Date().toLocaleTimeString() }]); }}
                style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:18, color:'white', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <MessageCircle size={16}/> Message
              </button>
            </div>

            {/* Rating inline */}
            <div style={{ marginBottom:14 }}>
              <p style={{ margin:'0 0 10px', fontSize:12, color:C.muted, textAlign:'center' }}>Évaluer et terminer :</p>
              <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
                {[1,2,3,4,5].map(star => (
                  <motion.button key={star} whileTap={{ scale:0.85 }} onClick={() => saveRideToFirestore(star)} disabled={saving}
                    style={{ width:48, height:48, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Star size={24} color={C.green} fill="transparent"/>
                  </motion.button>
                ))}
              </div>
            </div>

            <button onClick={cancel} style={{ width:'100%', padding:'14px 0', background:'transparent', border:'1px solid rgba(255,80,80,0.3)', borderRadius:18, color:'rgba(255,80,80,0.7)', fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:2 }}>
              Annuler la course
            </button>
          </div>
        </motion.div>
      )}

      {/* CHAT */}
      <AnimatePresence>
        {showChat && driver && (
          <motion.div initial={{ y:100 }} animate={{ y:0 }} exit={{ y:100 }}
            style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:60, background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:20, maxHeight:'55vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, background:`linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'black' }}>{driver.avatar}</div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:800 }}>{driver.name}</p>
                  <p style={{ margin:0, fontSize:11, color:C.green }}>● En ligne</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background:C.faint, borderRadius:10, padding:'6px 8px', color:C.muted }}><X size={14}/></button>
            </div>
            <div style={{ flex:1, overflowY:'auto', marginBottom:12, display:'flex', flexDirection:'column', gap:8 }}>
              {chatMsgs.map(m => (
                <div key={m.id} style={{ textAlign: m.sender==='user'?'right':'left' }}>
                  <div style={{ display:'inline-block', background: m.sender==='user'?'rgba(183,255,107,0.15)':C.faint, border:`1px solid ${C.border}`, borderRadius:14, padding:'8px 12px', maxWidth:'70%' }}>
                    <p style={{ margin:0, fontSize:13 }}>{m.text}</p>
                    <p style={{ margin:'4px 0 0', fontSize:10, color:C.muted }}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Tapez un message..." onKeyPress={e => e.key==='Enter' && sendChatMessage()}
                style={{ flex:1, padding:'12px 14px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:16, color:'white', fontSize:13 }}/>
              <button onClick={sendChatMessage} style={{ padding:'12px 16px', background:C.green, borderRadius:16, color:'black', fontWeight:800, fontSize:12 }}>Envoyer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MODULE 1B : GORIDE CHAUFFEUR
// ══════════════════════════════════════════════════════════
const GoRideChauffeur = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { user } = useAuth();

  const [online, setOnline]         = useState(false);
  const [requests, setRequests]     = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [earnings, setEarnings]     = useState(0);
  const [ridesCount, setRidesCount] = useState(0);
  const [showCounter, setShowCounter]   = useState(null);
  const [counterPrice, setCounterPrice] = useState(null);
  const [showStats, setShowStats]   = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [rideStatus, setRideStatus] = useState('pending');
  const [enrolled, setEnrolled]     = useState(false);
  const [showEnroll, setShowEnroll] = useState(true);
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollForm, setEnrollForm] = useState({ fullName:'', phone:'', licenseNumber:'', carModel:'', carPlate:'' });

  // Charger stats depuis Firestore
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(db,'driver_rides'), where('driverId','==',user.uid), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        const rides = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        setRideHistory(rides);
        setRidesCount(rides.length);
        setEarnings(rides.reduce((s,r) => s + (r.price||0), 0));
      } catch(e) { console.error('Firestore driver:', e); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!online) { setRequests([]); return; }
    const timers = RIDE_REQUESTS.map((r,i) => setTimeout(() => setRequests(prev => [...prev,r]), (i+1)*2500));
    return () => timers.forEach(clearTimeout);
  }, [online]);

  const handleEnroll = async () => {
    if (!enrollForm.fullName || !enrollForm.phone || !enrollForm.licenseNumber) {
      toast('Remplissez les champs obligatoires', 'error'); return;
    }
    setEnrollStep(1);
    try {
      await addDoc(collection(db,'driver_applications'), { ...enrollForm, userId:user.uid, email:user.email, status:'pending', createdAt:serverTimestamp() });
    } catch(e) { console.error('Enrollment:', e); }
    setTimeout(() => { setEnrollStep(2); setEnrolled(true); toast('✅ Inscription validée !', 'success'); }, 4000);
  };

  const acceptRide = async (r) => {
    setActiveRide(r); setRequests([]); setRideStatus('accepted');
    toast(`✅ Course acceptée`, 'success');
  };

  const finishRide = async () => {
    const earned = activeRide?.price || 0;
    setEarnings(e => e + earned);
    setRidesCount(c => c + 1);
    try {
      await addDoc(collection(db,'driver_rides'), { driverId:user.uid, passenger:activeRide.passenger, from:activeRide.from, to:activeRide.to, price:earned, createdAt:serverTimestamp() });
    } catch(e) { console.error('Save ride:', e); }
    setRideHistory(prev => [{ id:Date.now(), passenger:activeRide.passenger, from:activeRide.from, to:activeRide.to, price:earned }, ...prev]);
    setActiveRide(null); setRideStatus('pending');
    toast(`💰 +${earned} DH enregistré !`, 'success');
  };

  const sendCounter = (r) => {
    if (!counterPrice || counterPrice < 10) { toast('Prix invalide', 'error'); return; }
    setTimeout(() => {
      if (Math.random() > 0.4) {
        setActiveRide({ ...r, price:parseInt(counterPrice) }); setRideStatus('accepted');
        toast(`✅ Passager accepté ${counterPrice} DH !`, 'success');
      } else { toast('❌ Passager a refusé', 'error'); }
      setShowCounter(null); setCounterPrice(null);
    }, 1500);
  };

  return (
    <div style={{ height:'100dvh', width:'100%', background:C.dark, position:'relative', overflow:'hidden', fontFamily:"'Inter',sans-serif", color:'white' }}>
      <style>{css}</style>

      {/* Carte */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <MapContainer center={[33.98,-4.99]} zoom={14} style={{ height:'100%', width:'100%' }} zoomControl attributionControl>
          <TileLayer attribution='&copy; OpenStreetMap' url={OSM}/>
          <Marker position={[33.98,-4.99]} icon={routeIcon(C.green)}><Popup>Ma position</Popup></Marker>
          {activeRide && <>
            <Marker position={[33.985,-4.995]} icon={routeIcon('#3B82F6')}><Popup>Départ : {activeRide.from}</Popup></Marker>
            <Marker position={[34.02,-5.00]} icon={routeIcon('#EF4444')}><Popup>Arrivée : {activeRide.to}</Popup></Marker>
            <Polyline positions={[[33.985,-4.995],[34.02,-5.00]]} color="#3B82F6" weight={4} dashArray="8,8"/>
          </>}
        </MapContainer>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'55%', background:'linear-gradient(to top,#0B0F19 50%,transparent)', pointerEvents:'none' }}/>
        {online && !activeRide && (
          <div style={{ position:'absolute', top:'35%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
            <motion.div animate={{ scale:[1,1.08,1] }} transition={{ repeat:Infinity, duration:2 }}
              style={{ width:80, height:80, borderRadius:'50%', border:`3px solid ${C.green}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
              <Navigation2 size={32} color={C.green}/>
            </motion.div>
            <p style={{ marginTop:10, fontSize:12, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Zone active</p>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div style={{ position:'absolute', top:20, left:20, right:20, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/goride')} style={{ width:48, height:48, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
          <ArrowLeft size={22}/>
        </button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setShowStats(!showStats)} style={{ width:48, height:48, background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:C.green }}>
            <BarChart3 size={20}/>
          </button>
          <div style={{ background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, padding:'8px 16px', display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <p style={{ margin:0, fontSize:9, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Gains</p>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:C.green }}>{earnings} DH</p>
            </div>
            <div style={{ width:1, height:24, background:C.border }}/>
            <div style={{ textAlign:'center' }}>
              <p style={{ margin:0, fontSize:9, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Courses</p>
              <p style={{ margin:0, fontSize:15, fontWeight:900 }}>{ridesCount}</p>
            </div>
          </div>
        </div>
        <div style={{ background:'rgba(22,27,40,0.95)', border:`1px solid ${C.border}`, borderRadius:16, padding:'6px 12px', display:'flex', gap:6, alignItems:'center' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: online ? C.green : 'rgba(255,255,255,0.2)', animation: online?'pulse 2s ease infinite':'none' }}/>
          <span style={{ fontSize:11, fontWeight:700, color: online?C.green:'rgba(255,255,255,0.4)' }}>{online?'En ligne':'Hors ligne'}</span>
        </div>
      </div>

      {/* Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ position:'absolute', top:80, left:20, right:20, zIndex:101, background:C.panel, border:`1px solid ${C.border}`, borderRadius:24, padding:20, maxHeight:'55vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:900, textTransform:'uppercase', fontStyle:'italic' }}>Statistiques</h3>
              <button onClick={() => setShowStats(false)} style={{ background:C.faint, borderRadius:10, padding:'6px 8px', color:C.muted }}><X size={14}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[['Total Courses',ridesCount],['Moy./Course', ridesCount>0 ? (earnings/ridesCount).toFixed(0)+' DH' : '0 DH']].map(([k,v],i) => (
                <div key={i} style={{ background:'rgba(183,255,107,0.08)', border:'1px solid rgba(183,255,107,0.15)', borderRadius:14, padding:14, textAlign:'center' }}>
                  <p style={{ margin:0, fontSize:22, fontWeight:900, color:C.green }}>{v}</p>
                  <p style={{ margin:'4px 0 0', fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase' }}>{k}</p>
                </div>
              ))}
            </div>
            {rideHistory.map((r,i) => (
              <div key={r.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:36, height:36, background:'rgba(59,130,246,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#3B82F6' }}>{(r.passenger||'?')[0]}</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:12, fontWeight:700 }}>{r.passenger}</p>
                  <p style={{ margin:0, fontSize:10, color:C.muted }}>{r.from} → {r.to}</p>
                </div>
                <p style={{ margin:0, fontSize:14, fontWeight:900, color:C.green }}>{r.price} DH</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENROLLMENT */}
      {showEnroll && enrollStep === 0 && (
        <motion.div initial={{ y:80, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:24, maxHeight:'75vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:900, textTransform:'uppercase', fontStyle:'italic' }}>Inscription Chauffeur</h3>
            <p style={{ margin:'0 0 20px', fontSize:12, color:C.muted }}>Complétez votre profil pour recevoir des courses</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[['Nom complet *','fullName','text','Mohammed Alami'],['Téléphone *','phone','tel','06 XX XX XX XX'],['N° Permis *','licenseNumber','text','B123456789'],['Email','email','email','email@example.com']].map(([label,field,type,ph]) => (
                <div key={field}>
                  <label style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{label}</label>
                  <input type={type} placeholder={ph} value={enrollForm[field]||''} onChange={e => setEnrollForm(p => ({...p,[field]:e.target.value}))}
                    style={{ width:'100%', padding:'12px 14px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:12, color:'white', fontSize:13 }}/>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              {[['Modèle véhicule','carModel','Dacia Logan'],['Plaque','carPlate','A-12345-FES']].map(([label,field,ph]) => (
                <div key={field}>
                  <label style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{label}</label>
                  <input type="text" placeholder={ph} value={enrollForm[field]||''} onChange={e => setEnrollForm(p => ({...p,[field]:e.target.value}))}
                    style={{ width:'100%', padding:'12px 14px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:12, color:'white', fontSize:13 }}/>
                </div>
              ))}
            </div>
            <button onClick={handleEnroll} style={{ width:'100%', padding:'18px 0', background:C.green, borderRadius:24, color:'black', fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase' }}>
              Soumettre mon inscription
            </button>
          </div>
        </motion.div>
      )}

      {showEnroll && enrollStep === 1 && (
        <motion.div initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:40, textAlign:'center' }}>
            <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:2, ease:'linear' }}
              style={{ width:64, height:64, background:C.faint, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Shield size={32} color={C.green}/>
            </motion.div>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:900, textTransform:'uppercase' }}>Vérification en cours...</h3>
            <p style={{ margin:0, fontSize:13, color:C.muted }}>Votre dossier est examiné.</p>
          </div>
        </motion.div>
      )}

      {showEnroll && enrollStep === 2 && (
        <motion.div initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:40, textAlign:'center' }}>
            <div style={{ width:72, height:72, background:'rgba(183,255,107,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <CheckCircle size={36} color={C.green}/>
            </div>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:900, textTransform:'uppercase' }}>Inscription Validée !</h3>
            <p style={{ margin:'0 0 20px', fontSize:13, color:C.muted }}>Votre profil chauffeur a été approuvé.</p>
            <button onClick={() => setShowEnroll(false)} style={{ padding:'16px 40px', background:C.green, borderRadius:20, color:'black', fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase' }}>
              Commencer à rouler
            </button>
          </div>
        </motion.div>
      )}

      {/* PANEL BAS */}
      {!showEnroll && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, padding:'0 16px 32px' }}>
          {!online && !activeRide && (
            <motion.div initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }}
              style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:32, textAlign:'center' }}>
              <div style={{ width:72, height:72, background:C.faint, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Car size={32} color="rgba(255,255,255,0.2)"/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:900, textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>Hors Ligne</h3>
              <p style={{ margin:'0 0 24px', fontSize:13, color:'rgba(255,255,255,0.25)' }}>Activez pour recevoir des courses</p>
              <motion.button whileTap={{ scale:0.97 }} onClick={() => { setOnline(true); toast('🟢 En ligne — Prêt !', 'success'); }}
                style={{ width:'100%', padding:'20px 0', borderRadius:28, background:C.green, color:'black', fontWeight:900, fontSize:14, letterSpacing:3, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <ToggleRight size={22}/> Démarrer
              </motion.button>
            </motion.div>
          )}

          {online && !activeRide && (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:40, padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: requests.length>0?16:0 }}>
                <div>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:900, textTransform:'uppercase', color:C.green }}>
                    {requests.length===0 ? 'En attente...' : `${requests.length} Course${requests.length>1?'s':''} disponible${requests.length>1?'s':''}`}
                  </h3>
                  <p style={{ margin:'3px 0 0', fontSize:11, color:C.muted }}>Demandes en temps réel</p>
                </div>
                <button onClick={() => { setOnline(false); setRequests([]); toast('🔴 Hors ligne', 'info'); }}
                  style={{ background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:12, padding:'8px 12px', color:'rgba(255,100,100,0.8)', fontSize:11, fontWeight:700 }}>
                  Arrêter
                </button>
              </div>
              {requests.length === 0 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'20px 0' }}>
                  <div style={{ width:36, height:36, border:`2px solid rgba(183,255,107,0.2)`, borderTop:`2px solid ${C.green}`, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
                  <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.3)' }}>Recherche passagers...</p>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:320, overflowY:'auto' }}>
                <AnimatePresence>
                  {requests.map((r,i) => (
                    <motion.div key={r.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                      style={{ background:C.faint, border:`1px solid ${C.border}`, borderRadius:20, padding:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                        <div style={{ width:44, height:44, background:'linear-gradient(135deg,#6C63FF,#3B82F6)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:'white' }}>{r.avatar}</div>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:800 }}>{r.passenger}</p>
                          <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.4)' }}>À <span style={{ color:C.green, fontWeight:700 }}>{r.driverDist}</span> de vous</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontSize:22, fontWeight:900, color:C.green, fontStyle:'italic' }}>{r.price} DH</p>
                        </div>
                      </div>
                      <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:12, padding:'10px 14px', marginBottom:10, position:'relative' }}>
                        <div style={{ position:'absolute', left:22, top:14, bottom:14, width:1.5, background:`linear-gradient(to bottom,${C.green},rgba(255,255,255,0.15))` }}/>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                          <div style={{ width:8, height:8, background:C.green, borderRadius:'50%', flexShrink:0, marginLeft:10 }}/>
                          <p style={{ margin:0, fontSize:12, fontWeight:600 }}>{r.from}</p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:8, height:8, background:'rgba(255,255,255,0.4)', borderRadius:'50%', flexShrink:0, marginLeft:10, border:'2px solid rgba(255,255,255,0.4)' }}/>
                          <p style={{ margin:0, fontSize:12, fontWeight:600 }}>{r.to}</p>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                        {[['Trajet',r.dist],['Durée',r.time],['Pickup',r.driverDist]].map(([k,v],j) => (
                          <div key={j} style={{ flex:1, background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'7px 6px', textAlign:'center' }}>
                            <p style={{ margin:0, fontSize:12, fontWeight:800 }}>{v}</p>
                            <p style={{ margin:0, fontSize:9, color:C.muted, fontWeight:700, textTransform:'uppercase' }}>{k}</p>
                          </div>
                        ))}
                      </div>
                      {showCounter === r.id ? (
                        <div style={{ display:'flex', gap:8 }}>
                          <input type="number" placeholder="Prix DH" value={counterPrice||''} onChange={e => setCounterPrice(e.target.value)}
                            style={{ flex:1, background:C.faint, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', color:'white', fontSize:14, fontWeight:700 }}/>
                          <button onClick={() => sendCounter(r)} style={{ padding:'12px 16px', background:C.green, borderRadius:12, color:'black', fontWeight:800, fontSize:12 }}>Envoyer</button>
                          <button onClick={() => { setShowCounter(null); setCounterPrice(null); }} style={{ padding:'12px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:12, color:'white' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:10 }}>
                          <motion.button whileTap={{ scale:0.96 }} onClick={() => acceptRide(r)} style={{ flex:2, padding:'14px 0', background:C.green, borderRadius:16, color:'black', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                            <Check size={18}/> Accepter {r.price} DH
                          </motion.button>
                          <button onClick={() => { setShowCounter(r.id); setCounterPrice(r.price+5); }} style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:16, color:'white', fontWeight:700, fontSize:12 }}>
                            Négocier
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeRide && rideStatus === 'accepted' && (
            <motion.div initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }}
              style={{ background:C.panel, border:'1px solid rgba(183,255,107,0.2)', borderRadius:40, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                <div style={{ width:8, height:8, background:'#3B82F6', borderRadius:'50%', animation:'pulse 1.5s ease infinite' }}/>
                <span style={{ fontSize:12, color:'#3B82F6', fontWeight:800, textTransform:'uppercase', letterSpacing:2 }}>Course Acceptée</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:56, height:56, background:'linear-gradient(135deg,#6C63FF,#3B82F6)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'white' }}>{activeRide.avatar}</div>
                <div>
                  <p style={{ margin:0, fontSize:16, fontWeight:900 }}>{activeRide.passenger}</p>
                  <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.5)' }}>{activeRide.from} → {activeRide.to}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:18, color:'white', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Phone size={16}/> Appeler
                </button>
                <button onClick={() => setRideStatus('in_progress')} style={{ flex:2, padding:'14px 0', background:C.green, borderRadius:18, color:'black', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:2 }}>
                  Démarrer
                </button>
              </div>
            </motion.div>
          )}

          {activeRide && rideStatus === 'in_progress' && (
            <motion.div initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }}
              style={{ background:C.panel, border:'1px solid rgba(183,255,107,0.2)', borderRadius:40, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                <div style={{ width:8, height:8, background:C.green, borderRadius:'50%', animation:'pulse 1.5s ease infinite' }}/>
                <span style={{ fontSize:12, color:C.green, fontWeight:800, textTransform:'uppercase', letterSpacing:2 }}>Course en cours</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:56, height:56, background:'linear-gradient(135deg,#6C63FF,#3B82F6)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'white' }}>{activeRide.avatar}</div>
                <div>
                  <p style={{ margin:0, fontSize:16, fontWeight:900 }}>{activeRide.passenger}</p>
                  <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.5)' }}>{activeRide.from} → {activeRide.to}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ flex:1, padding:'14px 0', background:C.faint, border:`1px solid ${C.border}`, borderRadius:18, color:'white', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Phone size={16}/> Appeler
                </button>
                <motion.button whileTap={{ scale:0.97 }} onClick={finishRide} style={{ flex:2, padding:'14px 0', background:C.green, borderRadius:18, color:'black', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:2 }}>
                  Terminer la course
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MODULE 2 : PART-TIME JOBS  (avec EmailJS)
// ══════════════════════════════════════════════════════════
const PartTimeJobs = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { user } = useAuth();

  const [selected, setSelected] = useState(null);
  const [step, setStep]         = useState('list');
  const [avail, setAvail]       = useState({});
  const [form, setForm]         = useState({ name: user?.displayName||'', email: user?.email||'', phone:'', note:'' });
  const [sending, setSending]   = useState(false);

  const toggleSlot = (day, slot) => {
    const key = `${day}-${slot}`;
    setAvail(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getAvailText = () => {
    const slots = Object.entries(avail).filter(([,v]) => v).map(([k]) => k.replace('-',' à '));
    return slots.length > 0 ? slots.join(', ') : 'Non précisé';
  };

  // Envoi réel via EmailJS + sauvegarde Firestore
  const submitApp = async () => {
    if (!form.name || !form.email || !form.phone) { toast('Remplis tous les champs !', 'error'); return; }
    setSending(true);
    try {
      // EmailJS
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:    CONTACT_EMAIL,
        from_name:   form.name,
        from_email:  form.email,
        phone:       form.phone,
        job_title:   selected.title,
        company:     selected.company,
        pay:         `${selected.pay} DH/h`,
        availability: getAvailText(),
        note:        form.note || 'Aucun message',
        user_uid:    user?.uid || 'anonymous',
      });

      // Firestore
      await addDoc(collection(db,'job_applications'), {
        userId:    user.uid,
        userEmail: user.email,
        jobId:     selected.id,
        company:   selected.company,
        title:     selected.title,
        name:      form.name,
        phone:     form.phone,
        availability: getAvailText(),
        note:      form.note,
        status:    'sent',
        createdAt: serverTimestamp(),
      });

      toast(`📧 Candidature envoyée à ${selected.company} !`, 'success');
      setStep('success');
    } catch(e) {
      console.error('EmailJS error:', e);
      toast('Erreur envoi : vérifiez vos clés EmailJS', 'error');
    } finally { setSending(false); }
  };

  if (step === 'success') return (
    <div style={{ minHeight:'100dvh', background:'#F9FAFC', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, fontFamily:"'Inter',sans-serif" }}>
      <style>{css}</style>
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} style={{ width:80, height:80, background:'rgba(37,99,235,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <CheckCircle size={40} color="#2563EB"/>
      </motion.div>
      <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:900, textTransform:'uppercase', color:'#0B0F19' }}>Candidature Envoyée !</h2>
      <p style={{ margin:'0 0 8px', fontSize:14, color:'#64748B', textAlign:'center' }}>Email transmis à <strong>{selected?.company}</strong> et à notre équipe</p>
      <p style={{ margin:'0 0 32px', fontSize:13, color:'#94A3B8', textAlign:'center' }}>Réponse attendue sous 48h à {form.email}</p>
      <button onClick={() => { setStep('list'); setSelected(null); setAvail({}); }}
        style={{ padding:'16px 40px', background:'#0B0F19', color:'white', borderRadius:20, fontWeight:900, fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>
        Retour aux offres
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', background:'#F9FAFC', fontFamily:"'Inter',sans-serif", paddingBottom:32 }}>
      <style>{css}</style>

      <div style={{ background:'#0B0F19', padding:'20px 20px 28px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <button onClick={() => step==='list' ? navigate('/') : setStep('list')} style={{ width:44, height:44, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'white', letterSpacing:-0.5 }}>
              Part-Time <span style={{ color:C.green }}>Jobs</span>
            </h1>
            <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Emplois étudiants — Fès</p>
          </div>
        </div>
        {step==='list' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:16, padding:'12px 16px' }}>
            <Search size={16} color={C.muted}/>
            <input placeholder="Rechercher..." style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:13 }} readOnly/>
          </div>
        )}
      </div>

      {step === 'list' && (
        <div style={{ padding:'20px 16px' }}>
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#64748B', fontWeight:600 }}>{JOBS.length} offres disponibles</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {JOBS.map(job => (
              <motion.div key={job.id} whileHover={{ y:-2 }} onClick={() => { setSelected(job); setStep('detail'); }}
                style={{ background:'white', borderRadius:24, padding:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', cursor:'pointer', border:'1px solid #F1F5F9' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  <div style={{ width:52, height:52, background:job.color, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'white', flexShrink:0 }}>{job.letter}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div>
                        <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#0F172A' }}>{job.title}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>{job.company}</p>
                      </div>
                      <p style={{ margin:0, fontSize:18, fontWeight:900, color:'#2563EB' }}>{job.pay} DH<span style={{ fontSize:11, color:'#94A3B8' }}>/h</span></p>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                      {job.tags.map((t,i) => <span key={i} style={{ background:'#EFF6FF', color:'#1D4ED8', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{t}</span>)}
                    </div>
                    <div style={{ display:'flex', gap:14, marginTop:8, fontSize:11, color:'#94A3B8' }}>
                      <span>🕐 {job.hours}</span><span>📍 {job.location}</span><span>📅 {job.type}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {step === 'detail' && selected && (
        <div style={{ padding:'20px 16px' }}>
          <div style={{ background:'white', borderRadius:24, padding:24, boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ width:64, height:64, background:selected.color, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:26, color:'white' }}>{selected.letter}</div>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#0F172A' }}>{selected.title}</h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B' }}>{selected.company} • {selected.location}</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
              {[['Taux',`${selected.pay} DH/h`,'#2563EB'],['Heures',selected.hours,'#0F172A'],['Planning',selected.type,'#0F172A']].map(([k,v,col],i) => (
                <div key={i} style={{ background:'#F8FAFC', borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:900, color:col }}>{v}</p>
                  <p style={{ margin:0, fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>{k}</p>
                </div>
              ))}
            </div>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'#475569', lineHeight:1.7 }}>{selected.desc}</p>
            <button onClick={() => setStep('apply')} style={{ width:'100%', padding:'18px 0', background:'#0B0F19', color:'white', borderRadius:20, fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase' }}>
              Postuler Maintenant
            </button>
          </div>
        </div>
      )}

      {step === 'apply' && selected && (
        <div style={{ padding:'20px 16px' }}>
          <div style={{ background:'white', borderRadius:24, padding:24, boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, padding:'14px 16px', background:'#EFF6FF', borderRadius:16 }}>
              <div style={{ width:40, height:40, background:selected.color, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:'white' }}>{selected.letter}</div>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>{selected.title}</p>
                <p style={{ margin:0, fontSize:12, color:'#2563EB', fontWeight:600 }}>{selected.company} • {selected.pay} DH/h</p>
              </div>
            </div>

            {/* Infos pré-remplies depuis Firebase Auth */}
            <h3 style={{ margin:'0 0 14px', fontSize:13, fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:1 }}>Vos Informations</h3>
            {[['Nom complet','name','text','Mohammed Alami'],['Email','email','email','m.alami@uemf.ma'],['Téléphone','phone','tel','06 12 34 56 78']].map(([label,field,type,ph]) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>{label}</label>
                <input type={type} placeholder={ph} value={form[field]} onChange={e => setForm(f => ({...f,[field]:e.target.value}))}
                  style={{ width:'100%', padding:'14px 16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:14, fontSize:14, color:'#0F172A' }}
                  onFocus={e => e.target.style.borderColor='#2563EB'}
                  onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
              </div>
            ))}

            <h3 style={{ margin:'20px 0 12px', fontSize:13, fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:1 }}>Disponibilités</h3>
            <div style={{ overflowX:'auto', marginBottom:20 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:380 }}>
                <thead>
                  <tr>
                    <td style={{ width:65, padding:'6px 4px', fontSize:10, fontWeight:700, color:'#94A3B8' }}></td>
                    {DAYS.map(d => <th key={d} style={{ padding:'6px 3px', fontSize:11, fontWeight:800, color:'#0F172A', textAlign:'center' }}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map(slot => (
                    <tr key={slot}>
                      <td style={{ padding:'3px 4px', fontSize:9, color:'#94A3B8', fontWeight:600, whiteSpace:'nowrap' }}>{slot}</td>
                      {DAYS.map(day => {
                        const k = `${day}-${slot}`;
                        const on = !!avail[k];
                        return (
                          <td key={day} style={{ padding:'3px 2px', textAlign:'center' }}>
                            <div onClick={() => toggleSlot(day,slot)}
                              style={{ width:30, height:26, borderRadius:7, background: on?'#2563EB':'#F1F5F9', border: on?'none':'1px solid #E2E8F0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', transition:'all 0.15s' }}>
                              {on && <Check size={13} color="white"/>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Message (facultatif)</label>
              <textarea placeholder="Présentez-vous brièvement..." value={form.note} onChange={e => setForm(f => ({...f,note:e.target.value}))}
                rows={3} style={{ width:'100%', padding:'14px 16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:14, fontSize:14, color:'#0F172A', resize:'none', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor='#2563EB'}
                onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
            </div>

            <motion.button whileTap={{ scale:0.97 }} onClick={submitApp} disabled={sending}
              style={{ width:'100%', padding:'20px 0', background: sending ? '#94A3B8' : '#0B0F19', color:'white', borderRadius:20, fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {sending
                ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 1s linear infinite' }}/> Envoi en cours...</>
                : <><Send size={18}/> Envoyer ma Candidature</>
              }
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MODULE 3 : STAGES  (avec EmailJS)
// ══════════════════════════════════════════════════════════
const Stages = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const { user } = useAuth();

  const [filter, setFilter]     = useState('Tous');
  const [selected, setSelected] = useState(null);
  const [step, setStep]         = useState('list');
  const [form, setForm]         = useState({ name: user?.displayName||'', email: user?.email||'', phone:'', theme:'', cvName:'' });
  const [sending, setSending]   = useState(false);

  const types = ['Tous','PFE','Été'];
  const shown = filter==='Tous' ? STAGES : STAGES.filter(s => s.type===filter);

  const submitStage = async () => {
    if (!form.name || !form.email) { toast('Remplis les champs obligatoires !', 'error'); return; }
    setSending(true);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:   CONTACT_EMAIL,
        from_name:  form.name,
        from_email: form.email,
        phone:      form.phone,
        job_title:  selected.title,
        company:    selected.company,
        pay:        `Stage ${selected.type} — ${selected.duration}`,
        availability: form.theme || 'Non précisé',
        note:       form.cvName ? `CV joint : ${form.cvName}` : 'Pas de CV joint',
        user_uid:   user?.uid || 'anonymous',
      });

      await addDoc(collection(db,'stage_applications'), {
        userId:    user.uid,
        userEmail: user.email,
        stageId:   selected.id,
        company:   selected.company,
        title:     selected.title,
        type:      selected.type,
        name:      form.name,
        phone:     form.phone,
        theme:     form.theme,
        hasCv:     !!form.cvName,
        status:    'sent',
        createdAt: serverTimestamp(),
      });

      toast(`📧 Dossier transmis à ${selected.company} !`, 'success');
      setStep('success');
    } catch(e) {
      console.error('Stage EmailJS:', e);
      toast('Erreur envoi : vérifiez vos clés EmailJS', 'error');
    } finally { setSending(false); }
  };

  if (step === 'success') return (
    <div style={{ minHeight:'100dvh', background:'#F9FAFC', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, fontFamily:"'Inter',sans-serif" }}>
      <style>{css}</style>
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} style={{ width:80, height:80, background:'rgba(139,92,246,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <GraduationCap size={40} color="#8B5CF6"/>
      </motion.div>
      <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:900, color:'#0B0F19' }}>Candidature Envoyée !</h2>
      <p style={{ margin:'0 0 32px', fontSize:13, color:'#94A3B8', textAlign:'center' }}>Dossier transmis à {selected?.company} — réponse sous 5 jours ouvrés</p>
      <button onClick={() => { setStep('list'); setSelected(null); setForm({ name:user?.displayName||'', email:user?.email||'', phone:'', theme:'', cvName:'' }); }}
        style={{ padding:'16px 40px', background:'#8B5CF6', color:'white', borderRadius:20, fontWeight:900, fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>
        Retour aux stages
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', background:'#F9FAFC', fontFamily:"'Inter',sans-serif", paddingBottom:32 }}>
      <style>{css}</style>

      <div style={{ background:'#0B0F19', padding:'20px 20px 28px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <button onClick={() => step==='list' ? navigate('/') : setStep('list')} style={{ width:44, height:44, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'white', letterSpacing:-0.5 }}>
              Stages & <span style={{ color:'#A78BFA' }}>PFE</span>
            </h1>
            <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Opportunités professionnelles</p>
          </div>
        </div>
        {step==='list' && (
          <div style={{ display:'flex', gap:8 }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ flex:1, padding:'10px 0', borderRadius:14, background: filter===t?'#8B5CF6':C.faint, border: filter===t?'none':`1px solid ${C.border}`, color: filter===t?'white':C.muted, fontWeight:700, fontSize:12, letterSpacing:1, textTransform:'uppercase' }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {step==='list' && (
        <div style={{ padding:'20px 16px' }}>
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#64748B', fontWeight:600 }}>{shown.length} stage{shown.length>1?'s':''} disponible{shown.length>1?'s':''}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {shown.map(s => (
              <motion.div key={s.id} whileHover={{ y:-2 }} onClick={() => { setSelected(s); setStep('detail'); }}
                style={{ background:'white', borderRadius:24, padding:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', cursor:'pointer', border:'1px solid #F1F5F9' }}>
                <div style={{ display:'flex', gap:14, marginBottom:12 }}>
                  <div style={{ width:52, height:52, background:s.color, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'white', flexShrink:0 }}>{s.letter}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <div>
                        <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#0F172A' }}>{s.title}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>{s.company}</p>
                      </div>
                      <span style={{ background: s.type==='PFE'?'#EDE9FE':'#DCFCE7', color: s.type==='PFE'?'#7C3AED':'#16A34A', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, height:'fit-content' }}>{s.type}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                  {s.tags.map((t,i) => <span key={i} style={{ background:'#F3F4F6', color:'#374151', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{t}</span>)}
                </div>
                <div style={{ display:'flex', gap:14, fontSize:11, color:'#94A3B8' }}>
                  <span>⏱ {s.duration}</span><span>🎓 {s.level}</span><span>📍 {s.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {step==='detail' && selected && (
        <div style={{ padding:'20px 16px' }}>
          <div style={{ background:'white', borderRadius:24, padding:24, boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', gap:14, marginBottom:20 }}>
              <div style={{ width:64, height:64, background:selected.color, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:26, color:'white' }}>{selected.letter}</div>
              <div>
                <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0F172A' }}>{selected.title}</h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B' }}>{selected.company} • {selected.location}</p>
                <span style={{ background: selected.type==='PFE'?'#EDE9FE':'#DCFCE7', color: selected.type==='PFE'?'#7C3AED':'#16A34A', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, display:'inline-block', marginTop:6 }}>{selected.type}</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[['Durée',selected.duration],['Niveau',selected.level],['Domaine',selected.domain],['Lieu',selected.location]].map(([k,v],i) => (
                <div key={i} style={{ background:'#F8FAFC', borderRadius:14, padding:'12px 14px' }}>
                  <p style={{ margin:0, fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{k}</p>
                  <p style={{ margin:'4px 0 0', fontSize:13, fontWeight:800, color:'#0F172A' }}>{v}</p>
                </div>
              ))}
            </div>
            <p style={{ margin:'0 0 24px', fontSize:14, color:'#475569', lineHeight:1.7 }}>{selected.desc}</p>
            <button onClick={() => setStep('apply')} style={{ width:'100%', padding:'18px 0', background:'#8B5CF6', color:'white', borderRadius:20, fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase' }}>
              Postuler à ce Stage
            </button>
          </div>
        </div>
      )}

      {step==='apply' && selected && (
        <div style={{ padding:'20px 16px' }}>
          <div style={{ background:'white', borderRadius:24, padding:24, boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', gap:12, marginBottom:24, padding:'14px 16px', background:'#F5F3FF', borderRadius:16 }}>
              <div style={{ width:40, height:40, background:selected.color, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:'white' }}>{selected.letter}</div>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>{selected.title}</p>
                <p style={{ margin:0, fontSize:12, color:'#7C3AED', fontWeight:600 }}>{selected.company} • {selected.type}</p>
              </div>
            </div>
            {[['Nom complet *','name','text','Mohammed Alami'],['Email UEMF *','email','email','m.alami@uemf.ma'],['Téléphone','phone','tel','06 XX XX XX XX'],['Thématique recherchée','theme','text','Machine Learning, Finance...']].map(([label,field,type,ph]) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>{label}</label>
                <input type={type} placeholder={ph} value={form[field]} onChange={e => setForm(f => ({...f,[field]:e.target.value}))}
                  style={{ width:'100%', padding:'14px 16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:14, fontSize:14, color:'#0F172A', fontFamily:'inherit' }}
                  onFocus={e => e.target.style.borderColor='#8B5CF6'}
                  onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
              </div>
            ))}
            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>CV / Lettre de motivation</label>
              <div onClick={() => setForm(f => ({...f,cvName: f.cvName?'':'CV_UEMF_2025.pdf'}))}
                style={{ padding:'18px 16px', background: form.cvName?'#F5F3FF':'#F8FAFC', border:`1.5px dashed ${form.cvName?'#8B5CF6':'#CBD5E1'}`, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                {form.cvName
                  ? <><FileText size={18} color="#8B5CF6"/><span style={{ fontSize:13, fontWeight:700, color:'#7C3AED' }}>{form.cvName}</span><Check size={16} color="#8B5CF6"/></>
                  : <><Upload size={18} color="#94A3B8"/><span style={{ fontSize:13, color:'#94A3B8', fontWeight:600 }}>Cliquez pour joindre votre CV (PDF)</span></>
                }
              </div>
            </div>
            <motion.button whileTap={{ scale:0.97 }} onClick={submitStage} disabled={sending}
              style={{ width:'100%', padding:'20px 0', background: sending?'#94A3B8':'#8B5CF6', color:'white', borderRadius:20, fontWeight:900, fontSize:14, letterSpacing:2, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {sending
                ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 1s linear infinite' }}/> Envoi...</>
                : <><Send size={18}/> Soumettre ma Candidature</>
              }
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MODULE 4 : LOGEMENT
// ══════════════════════════════════════════════════════════
const Logement = () => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [view, setView]         = useState('list');
  const [selected, setSelected] = useState(null);
  const [liked, setLiked]       = useState({});
  const [filter, setFilter]     = useState('Tous');

  const types = ['Tous','Studio','Coloc','F2','Chambre'];
  const shown = filter==='Tous' ? LOGEMENTS : LOGEMENTS.filter(l => l.type===filter);

  const toggleLike = (id, e) => { e.stopPropagation(); setLiked(p => ({...p,[id]:!p[id]})); toast(liked[id]?'Retiré des favoris':'❤️ Ajouté aux favoris', liked[id]?'info':'success'); };

  return (
    <div style={{ minHeight:'100dvh', background:'#F9FAFC', fontFamily:"'Inter',sans-serif", paddingBottom:32 }}>
      <style>{css}</style>

      <div style={{ background:'#0B0F19', padding:'20px 20px 20px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => view!=='list' ? setView('list') : navigate('/')} style={{ width:44, height:44, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
              <ArrowLeft size={20}/>
            </button>
            <div>
              <h1 style={{ margin:0, fontSize:20, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', color:'white' }}>
                Home<span style={{ color:C.green }}>zy</span>
              </h1>
              <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Logements — Fès</p>
            </div>
          </div>
          {view !== 'detail' && (
            <button onClick={() => setView(v => v==='list'?'map':'list')} style={{ padding:'10px 16px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, color:'white', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
              {view==='map' ? <><Building2 size={14}/> Liste</> : <><MapPin size={14}/> Carte</>}
            </button>
          )}
        </div>
        {view==='list' && (
          <div style={{ display:'flex', gap:8, overflowX:'auto' }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ flexShrink:0, padding:'8px 16px', borderRadius:20, background: filter===t?C.green:C.faint, border: filter===t?'none':`1px solid ${C.border}`, color: filter===t?'black':C.muted, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:1 }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {view==='list' && (
        <div style={{ padding:'20px 16px' }}>
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#64748B', fontWeight:600 }}>{shown.length} logement{shown.length>1?'s':''} disponible{shown.length>1?'s':''}</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {shown.map(l => (
              <motion.div key={l.id} whileHover={{ y:-3 }} onClick={() => { setSelected(l); setView('detail'); }}
                style={{ background:'white', borderRadius:24, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', cursor:'pointer', border:'1px solid #F1F5F9' }}>
                <div style={{ position:'relative', height:130 }}>
                  <img src={l.img} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={l.title}/>
                  <button onClick={e => toggleLike(l.id,e)} style={{ position:'absolute', top:10, right:10, width:32, height:32, background:'rgba(255,255,255,0.9)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'none' }}>
                    <Heart size={16} color={liked[l.id]?'#EF4444':'#94A3B8'} fill={liked[l.id]?'#EF4444':'transparent'}/>
                  </button>
                  {l.verified && <div style={{ position:'absolute', top:10, left:10, background:C.green, color:'black', fontSize:9, fontWeight:900, padding:'2px 7px', borderRadius:10 }}>VÉRIFIÉ</div>}
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#0F172A', lineHeight:1.3 }}>{l.title}</p>
                  <p style={{ margin:'4px 0 0', fontSize:11, color:'#94A3B8' }}>{l.type} • {l.size}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:900, color:'#2563EB' }}>{l.price.toLocaleString()}<span style={{ fontSize:10, color:'#94A3B8' }}> DH/m</span></p>
                    <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>⭐ {l.rating}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {view==='map' && (
        <div style={{ height:'calc(100dvh - 120px)' }}>
          <MapContainer center={[33.99,-4.99]} zoom={14} style={{ height:'100%', width:'100%' }} zoomControl attributionControl>
            <TileLayer attribution='&copy; OpenStreetMap' url={OSM}/>
            {LOGEMENTS.map(l => (
              <Marker key={l.id} position={l.coords} icon={priceIcon(l.price.toLocaleString()+' DH')}>
                <Popup>
                  <div style={{ fontFamily:'Inter,sans-serif', minWidth:200 }}>
                    <img src={l.img} style={{ width:'100%', height:110, objectFit:'cover', borderRadius:8, marginBottom:8 }} alt={l.title}/>
                    <strong style={{ fontSize:13, color:'#0B0F19' }}>{l.title}</strong>
                    <p style={{ margin:'4px 0', fontSize:14, color:'#2563EB', fontWeight:800 }}>{l.price.toLocaleString()} DH/mois</p>
                    <p style={{ margin:'0 0 8px', fontSize:11, color:'#64748B' }}>⭐ {l.rating} • {l.type} • {l.size}</p>
                    <button onClick={() => { setSelected(l); setView('detail'); }} style={{ width:'100%', padding:'10px 0', background:'#0B0F19', color:'white', borderRadius:10, fontWeight:700, fontSize:12, border:'none', cursor:'pointer' }}>
                      Voir les détails
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {view==='detail' && selected && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ paddingBottom:32 }}>
          <div style={{ position:'relative', height:260 }}>
            <img src={selected.img} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={selected.title}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.4))' }}/>
            <button onClick={e => toggleLike(selected.id,e)} style={{ position:'absolute', top:20, right:20, width:44, height:44, background:'rgba(255,255,255,0.9)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>
              <Heart size={22} color={liked[selected.id]?'#EF4444':'#94A3B8'} fill={liked[selected.id]?'#EF4444':'transparent'}/>
            </button>
          </div>
          <div style={{ padding:'20px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#0F172A' }}>{selected.title}</h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B' }}>{selected.type} • {selected.size}</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B"/>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{selected.rating}</span>
                  <span style={{ fontSize:12, color:'#94A3B8' }}>({selected.reviews} avis)</span>
                  {selected.verified && <span style={{ background:'#DCFCE7', color:'#16A34A', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:10 }}>VÉRIFIÉ</span>}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:24, fontWeight:900, color:'#2563EB' }}>{selected.price.toLocaleString()}</p>
                <p style={{ margin:0, fontSize:12, color:'#94A3B8', fontWeight:600 }}>DH / mois</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {selected.amenities.map((a,i) => (
                <span key={i} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', color:'#475569', fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:6 }}>
                  {a==='Wifi'&&<Wifi size={13}/>}{a==='Meublé'&&<Bed size={13}/>}{a==='Parking'&&<Car size={13}/>}{a==='Balcon'&&<Eye size={13}/>}{a==='Clim'&&'❄️'}{a==='Sécurité'&&<Shield size={13}/>}{a==='Piscine'&&'🏊'}{a}
                </span>
              ))}
            </div>

            <p style={{ margin:'0 0 20px', fontSize:14, color:'#475569', lineHeight:1.7 }}>{selected.desc}</p>

            <div style={{ height:200, borderRadius:20, overflow:'hidden', marginBottom:20, border:'2px solid #E2E8F0' }}>
              <MapContainer center={selected.coords} zoom={15} style={{ height:'100%', width:'100%' }} zoomControl attributionControl scrollWheelZoom={false}>
                <TileLayer attribution='&copy; OpenStreetMap' url={OSM}/>
                <Marker position={selected.coords} icon={routeIcon('#2563EB')}><Popup>{selected.title}</Popup></Marker>
              </MapContainer>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'#F8FAFC', borderRadius:20, marginBottom:20 }}>
              <div style={{ width:48, height:48, background:'#E0E7FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#3730A3' }}>{selected.landlord[0]}</div>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>{selected.landlord}</p>
                <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Propriétaire • Répond sous 2h</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => toast('💬 Message envoyé !', 'info')} style={{ flex:1, padding:'16px 0', background:'#F1F5F9', border:'1px solid #E2E8F0', borderRadius:18, color:'#0F172A', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <MessageCircle size={16}/> Message
              </button>
              <button onClick={() => toast(`📞 Contact : ${selected.landlord}`, 'success')} style={{ flex:2, padding:'16px 0', background:'#0B0F19', borderRadius:18, color:'white', fontWeight:900, fontSize:13, letterSpacing:1, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Phone size={16}/> Contacter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  MENU PRINCIPAL
// ══════════════════════════════════════════════════════════
const MainMenu = () => {
  const navigate    = useNavigate();
  const toast       = useToast();
  const { user, logout } = useAuth();
  const [notif, setNotif] = useState(3);

  const modules = [
    { id:'goride',   label:'GoRide', sub:'Covoiturage · Négociez votre prix', color:C.green,   bg:'#0B0F19', badge:'TRANSPORT', badgeBg:C.green,    badgeCol:'black', path:'/goride',   big:true,  icon:<Car size={200} style={{ position:'absolute', right:-20, bottom:-20, color:'white', opacity:0.05 }}/> },
    { id:'jobs',     label:'Jobs',   sub:'Part-time · Décathlon · Defacto',   color:'#60A5FA', bg:'#1E3A5F', badge:'EMPLOI',    badgeBg:'#3B82F6', badgeCol:'white', path:'/jobs',     big:false, icon:<Briefcase size={90} style={{ position:'absolute', right:-10, bottom:-10, color:'white', opacity:0.08 }}/> },
    { id:'stages',   label:'Stages', sub:'PFE · Stage été · Postuler',        color:'#C4B5FD', bg:'#2D1F5E', badge:'PFE & ÉTÉ', badgeBg:'#8B5CF6', badgeCol:'white', path:'/stages',   big:false, icon:<GraduationCap size={90} style={{ position:'absolute', right:-10, bottom:-10, color:'white', opacity:0.08 }}/> },
    { id:'logement', label:'Homezy', sub:'Studios · Colocations · Carte',     color:'#6EE7B7', bg:'#0D3530', badge:'LOGEMENT',  badgeBg:'#10B981', badgeCol:'white', path:'/logement', big:false, icon:<Home size={90} style={{ position:'absolute', right:-10, bottom:-10, color:'white', opacity:0.08 }}/> },
  ];

  const handleLogout = async () => {
    await logout();
    toast('Déconnecté', 'info');
    navigate('/login');
  };

  return (
    <div style={{ minHeight:'100dvh', background:'#F0F2F5', fontFamily:"'Inter',sans-serif", paddingBottom:100 }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background:'#0B0F19', padding:'24px 20px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:'rgba(183,255,107,0.15)', border:`1.5px solid rgba(183,255,107,0.3)`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={22} color={C.green} fill={C.green}/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', letterSpacing:-1, color:'white' }}>
                Campus<span style={{ color:C.green }}>Link</span>
              </h1>
              <p style={{ margin:0, fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>UEMF Edition</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => { setNotif(0); toast('Notifications lues', 'info'); }}
              style={{ position:'relative', width:44, height:44, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
              <Bell size={20}/>
              {notif > 0 && <div style={{ position:'absolute', top:8, right:8, width:16, height:16, background:'#EF4444', borderRadius:'50%', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', color:'white', border:'2px solid #0B0F19' }}>{notif}</div>}
            </button>
            <button onClick={handleLogout} style={{ width:44, height:44, background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,100,100,0.7)' }}>
              <LogOut size={18}/>
            </button>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(183,255,107,0.06)', border:'1px solid rgba(183,255,107,0.15)', borderRadius:16 }}>
            <div style={{ width:36, height:36, background:`linear-gradient(135deg,${C.green},${C.greenD})`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:'black' }}>
              {(user.displayName||user.email||'U')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:'white' }}>{user.displayName || 'Étudiant UEMF'}</p>
              <p style={{ margin:0, fontSize:11, color:C.muted }}>{user.email}</p>
            </div>
            <div style={{ marginLeft:'auto', width:8, height:8, background:C.green, borderRadius:'50%', animation:'pulse 2s ease infinite' }}/>
          </div>
        )}
      </div>

      {/* Grid modules */}
      <div style={{ padding:'20px 16px' }}>
        <p style={{ margin:'0 0 14px', fontSize:12, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>Services disponibles</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {modules.map(m => (
            <motion.div key={m.id} whileHover={{ y:-4 }} whileTap={{ scale:0.97 }} onClick={() => navigate(m.path)}
              style={{ gridColumn: m.big?'1 / -1':'auto', background:m.bg, borderRadius:m.big?36:28, padding: m.big?'28px 24px':'20px 18px', position:'relative', overflow:'hidden', cursor:'pointer', minHeight: m.big?160:130 }}>
              <span style={{ background:m.badgeBg, color:m.badgeCol, fontSize:8, fontWeight:900, padding:'3px 10px', borderRadius:20, letterSpacing:2, textTransform:'uppercase', fontStyle:'italic', display:'inline-block', marginBottom: m.big?10:8 }}>{m.badge}</span>
              <h2 style={{ color:m.color, fontSize: m.big?48:26, fontWeight:900, fontStyle:'italic', textTransform:'uppercase', margin:`${m.big?8:4}px 0 ${m.big?6:4}px`, lineHeight:1, letterSpacing:-1 }}>{m.label}</h2>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize: m.big?12:11, margin:0, fontWeight:500, fontStyle:'italic' }}>{m.sub}</p>
              {m.icon}
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:20 }}>
          {[['🚗','Chauffeurs',`${DRIVERS.length} actifs`],['💼','Jobs',`${JOBS.length} postes`],['🏠','Logements',`${LOGEMENTS.length} dispo`]].map(([emoji,label,val],i) => (
            <div key={i} style={{ background:'white', borderRadius:20, padding:'14px 12px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
              <p style={{ margin:0, fontSize:20 }}>{emoji}</p>
              <p style={{ margin:'4px 0 0', fontSize:12, fontWeight:900, color:'#0F172A' }}>{val}</p>
              <p style={{ margin:'2px 0 0', fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'rgba(11,15,25,0.97)', border:`1px solid ${C.border}`, borderRadius:32, padding:'12px 28px', display:'flex', gap:32, alignItems:'center', zIndex:100, backdropFilter:'blur(20px)' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', color:C.green, cursor:'pointer' }}>
          <Home size={22}/><span style={{ fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Accueil</span>
        </button>
        <motion.div whileTap={{ scale:0.9 }} onClick={() => navigate('/goride')} style={{ width:52, height:52, background:C.green, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', marginTop:-8, boxShadow:`0 8px 20px rgba(183,255,107,0.25)`, cursor:'pointer' }}>
          <Car size={24} color="black"/>
        </motion.div>
        <button style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>
          <User size={22}/><span style={{ fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Profil</span>
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
//  APP — ROUTAGE PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/" element={<ProtectedRoute><MainMenu/></ProtectedRoute>}/>
            <Route path="/goride" element={<ProtectedRoute><GoRidePassager/></ProtectedRoute>}/>
            <Route path="/goride/chauffeur" element={<ProtectedRoute><GoRideChauffeur/></ProtectedRoute>}/>
            <Route path="/jobs" element={<ProtectedRoute><PartTimeJobs/></ProtectedRoute>}/>
            <Route path="/stages" element={<ProtectedRoute><Stages/></ProtectedRoute>}/>
            <Route path="/logement" element={<ProtectedRoute><Logement/></ProtectedRoute>}/>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}