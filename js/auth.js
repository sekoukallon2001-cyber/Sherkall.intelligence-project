// =====================================================
// SHERKALL INTELLIGENCE — AUTH MODULE
// js/auth.js
// =====================================================
// sessionStorage = single source of truth per tab.
// localStorage = persistence only (new tab initial sync).
// No mixing. No fallback contamination.

// ── SYNC ──────────────────────────────────────────────
// Called once per tab on first access.
// If this tab has no session yet, copies from localStorage.
// After this, sessionStorage is the only thing read.
function ensureSession() {
  if (!sessionStorage.getItem('sherkall_token')) {
    const t = localStorage.getItem('sherkall_token');
    const u = localStorage.getItem('sherkall_user');
    if (t && u) {
      sessionStorage.setItem('sherkall_token', t);
      sessionStorage.setItem('sherkall_user',  u);
    }
  }
}

// ── READ — sessionStorage only after sync ─────────────
export function getToken() {
  ensureSession();
  return sessionStorage.getItem('sherkall_token');
}

export function getUser() {
  ensureSession();
  const raw = sessionStorage.getItem('sherkall_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ── WRITE ─────────────────────────────────────────────
export function setSession(token, user) {
  const userStr = JSON.stringify(user);
  sessionStorage.setItem('sherkall_token', token);
  sessionStorage.setItem('sherkall_user',  userStr);
  localStorage.setItem('sherkall_token',   token);
  localStorage.setItem('sherkall_user',    userStr);
}

// ── CLEAR ─────────────────────────────────────────────
export function clearSession() {
  ['sherkall_token', 'sherkall_user'].forEach(k => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
}

// ── ROLE GUARD ────────────────────────────────────────
// Critical rule: token and user must come from the SAME
// storage source. Never mix sessionStorage token with
// localStorage user — they may belong to different accounts.
export function requireRole(expectedRole) {
  // Try sessionStorage first (tab-specific, freshest data)
  let token  = sessionStorage.getItem('sherkall_token');
  let rawUser = sessionStorage.getItem('sherkall_user');

  // Only fall back to localStorage if BOTH are missing from sessionStorage
  // Never mix one from session and one from local
  if (!token || !rawUser) {
    token   = localStorage.getItem('sherkall_token');
    rawUser = localStorage.getItem('sherkall_user');

    // If found in localStorage, sync to sessionStorage immediately
    if (token && rawUser) {
      sessionStorage.setItem('sherkall_token', token);
      sessionStorage.setItem('sherkall_user',  rawUser);
    }
  }

  if (!token || !rawUser) {
    window.location.href = '/login.html';
    return null;
  }

  let user;
  try { user = JSON.parse(rawUser); } catch {
    // Corrupt storage — clear everything and force re-login
    ['sherkall_token','sherkall_user'].forEach(k => {
      sessionStorage.removeItem(k); localStorage.removeItem(k);
    });
    window.location.href = '/login.html';
    return null;
  }

  if (!user?.role) {
    window.location.href = '/login.html';
    return null;
  }

  if (expectedRole === 'client' && user.role === 'admin') {
    window.location.href = '/admin.html';
    return null;
  }

  if (expectedRole === 'admin' && user.role !== 'admin') {
    window.location.href = '/login.html';
    return null;
  }

  return { token, user };
}
