// =====================================================
// SHERKALL INTELLIGENCE — AUTH MODULE
// js/auth.js
// =====================================================

const KEY_TOKEN = 'sherkall_token';
const KEY_USER  = 'sherkall_user';

// ── SESSION SYNC ──────────────────────────────────────
// Called at the start of every auth operation.
// Priority:
//   1. URL hash token — freshest, just came from login
//   2. sessionStorage — tab-specific current session
//   3. localStorage   — cross-tab persistence fallback
function ensureSession() {
  // 1. URL hash — freshest data, passed directly from login
  //    Both token AND user come from hash so we never touch localStorage
  //    which may have stale data from a different account
  const hash = window.location.hash || '';
  if (hash.includes('tk=')) {
    try {
      const params = new URLSearchParams(hash.slice(1));
      const tk = decodeURIComponent(params.get('tk') || '');
      const u  = decodeURIComponent(params.get('u')  || '');
      if (tk && u) {
        sessionStorage.setItem(KEY_TOKEN, tk);
        sessionStorage.setItem(KEY_USER,  u);
        history.replaceState(null, '', window.location.pathname);
        return;
      }
    } catch {}
  }

  // 2. If sessionStorage empty, sync from localStorage
  if (!sessionStorage.getItem(KEY_TOKEN)) {
    const t = localStorage.getItem(KEY_TOKEN);
    const u = localStorage.getItem(KEY_USER);
    if (t && u) {
      sessionStorage.setItem(KEY_TOKEN, t);
      sessionStorage.setItem(KEY_USER,  u);
    }
  }
}

// ── READ ──────────────────────────────────────────────
export function getToken() {
  ensureSession();
  return sessionStorage.getItem(KEY_TOKEN);
}

export function getUser() {
  ensureSession();
  const raw = sessionStorage.getItem(KEY_USER);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ── WRITE ─────────────────────────────────────────────
export function setSession(token, user) {
  const str = JSON.stringify(user);
  sessionStorage.setItem(KEY_TOKEN, token);
  sessionStorage.setItem(KEY_USER,  str);
  localStorage.setItem(KEY_TOKEN,   token);
  localStorage.setItem(KEY_USER,    str);
}

// ── CLEAR ─────────────────────────────────────────────
export function clearSession() {
  [KEY_TOKEN, KEY_USER].forEach(k => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
}

// ── ROLE GUARD ────────────────────────────────────────
export function requireRole(expectedRole) {
  // ensureSession MUST run first — handles hash token and localStorage sync
  ensureSession();

  const token   = sessionStorage.getItem(KEY_TOKEN);
  const rawUser = sessionStorage.getItem(KEY_USER);

  if (!token || !rawUser) {
    window.location.href = '/login.html';
    return null;
  }

  let user;
  try { user = JSON.parse(rawUser); } catch {
    clearSession();
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
