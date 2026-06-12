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
// Both token and user come from sessionStorage only.
// No localStorage fallback — no cross-tab contamination.
export function requireRole(expectedRole) {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
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

  return { token, user }; // both from sessionStorage — single source, no mixing
}
