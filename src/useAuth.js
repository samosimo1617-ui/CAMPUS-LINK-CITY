// src/hooks/useAuth.js
// ─────────────────────────────────────────────────────────
//  Hook custom — expose l'utilisateur courant + loading
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../firebase';

export const useAuth = () => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub; // cleanup listener on unmount
  }, []);

  return { user, loading };
};