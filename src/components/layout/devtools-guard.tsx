'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';

// Deterrent only: browsers can't truly hide DevTools (menu, view-source:, JS off all get round it).
// Real protection stays on the server (API auth, Firestore rules).
const PROTECTED_HOSTS = ['smartlabs.lk', 'www.smartlabs.lk'];
const STAFF_ROLES = ['admin', 'developer'];

function isDevToolsShortcut(e: KeyboardEvent) {
  const k = e.key.toLowerCase();
  if (e.key === 'F12') return true;
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) return true; // Win/Linux panels
  if (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) return true; // Mac panels + source
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && k === 'u') return true; // view source
  return false;
}

function isEditable(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function DevToolsGuard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (!user) { setIsStaff(false); return; }
    getDoc(doc(firestore, 'users', user.uid))
      .then(snap => setIsStaff(STAFF_ROLES.includes(snap.data()?.role)))
      .catch(() => setIsStaff(false));
  }, [user, firestore]);

  useEffect(() => {
    // Vercel preview links (behind Vercel login), localhost and staff accounts keep full DevTools.
    if (!PROTECTED_HOSTS.includes(window.location.hostname) || isStaff || isUserLoading) return;

    const onKey = (e: KeyboardEvent) => { if (isDevToolsShortcut(e)) { e.preventDefault(); e.stopPropagation(); } };
    // Text boxes keep their menu (spell-check suggestions, paste).
    const onMenu = (e: MouseEvent) => { if (!isEditable(e.target)) e.preventDefault(); };

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('contextmenu', onMenu, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('contextmenu', onMenu, true);
    };
  }, [isStaff, isUserLoading]);

  return null;
}
