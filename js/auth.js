// TEMPORARY DEBUG VERSION - remove after testing

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

export function getToken() {
  ensureSession();
  return sessionStorage.getItem('sherkall_token');
}

export function getUser() {
  ensureSession();
  const raw = sessionStorage.getItem('sherkall_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function setSession(token, user) {
  const userStr = JSON.stringify(user);
  sessionStorage.setItem('sherkall_token', token);
  sessionStorage.setItem('sherkall_user',  userStr);
  localStorage.setItem('sherkall_token',   token);
  localStorage.setItem('sherkall_user',    userStr);
}

export function clearSession() {
  ['sherkall_token', 'sherkall_user'].forEach(k => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
}

export function requireRole(expectedRole) {
  const ssToken  = sessionStorage.getItem('sherkall_token');
  const ssUser   = sessionStorage.getItem('sherkall_user');
  const lsToken  = localStorage.getItem('sherkall_token');
  const lsUser   = localStorage.getItem('sherkall_user');

  // DEBUG — remove after testing
  alert(
    'SS token: ' + (ssToken ? 'YES' : 'NO') +
    '\nSS user: ' + (ssUser ? ssUser.substring(0,50) : 'NO') +
    '\nLS token: ' + (lsToken ? 'YES' : 'NO') +
    '\nLS user: ' + (lsUser ? lsUser.substring(0,50) : 'NO')
  );

  let token   = ssToken;
  let rawUser = ssUser;

  if (!token || !rawUser) {
    token   = lsToken;
    rawUser = lsUser;
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
    ['sherkall_token','sherkall_user'].forEach(k => {
      sessionStorage.removeItem(k); localStorage.removeItem(k);
    });
    window.location.href = '/login.html';
    return null;
  }

  // DEBUG
  alert('Parsed role: ' + user?.role + ' | Expected: ' + expectedRole);

  if (!user?.role) { window.location.href = '/login.html'; return null; }
  if (expectedRole === 'client' && user.role === 'admin') { window.location.href = '/admin.html'; return null; }
  if (expectedRole === 'admin' && user.role !== 'admin') { window.location.href = '/login.html'; return null; }

  return { token, user };
}
