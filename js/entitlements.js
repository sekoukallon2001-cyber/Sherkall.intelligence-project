// =====================================================
// SHERKALL INTELLIGENCE — ENTITLEMENTS MODULE
// js/entitlements.js
// =====================================================
// Loads client feature entitlements once per session.
// Cached in sessionStorage — no repeated API calls.
// Used by dashboard modules to gate features.
//
// Architecture principle:
// Frontend gates = UX (hide/show)
// Backend middleware = security (block API calls)
// Both must exist. Frontend alone is not security.

import { BACKEND_URL } from './config.js';
import { getToken }    from './auth.js';

const CACHE_KEY = 'sherkall_entitlements';

// ── DEFAULTS ──────────────────────────────────────────
// Used when entitlement hasn't loaded yet or user has
// no plan assigned. Fail-safe: deny everything except
// live tracking which is on all plans.
const DEFAULTS = {
  plan_name:   null,
  monthly_fee: 0,
  max_devices: 1,
  status:      'active',
  features: {
    live_tracking:    true,
    geofencing:       false,
    custom_geofences: false,
    alerts_whatsapp:  false,
    speed_alerts:     false,
    history_days:     1,
    report_export:    false,
    multi_user:       false,
    api_access:       false
  }
};

let _entitlement = null;

// ── LOAD ──────────────────────────────────────────────
// Called once on dashboard init. Caches in sessionStorage
// so tab refreshes don't re-fetch unnecessarily.
export async function loadEntitlements() {
  // Check session cache first
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      _entitlement = JSON.parse(cached);
      return _entitlement;
    } catch {}
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/entitlements/me`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error(`Entitlements fetch failed: ${res.status}`);
    const data = await res.json();

    // null entitlement means no plan assigned yet
    _entitlement = data.entitlement || DEFAULTS;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(_entitlement));
    return _entitlement;

  } catch (err) {
    console.warn('loadEntitlements failed — using defaults:', err.message);
    _entitlement = DEFAULTS;
    return _entitlement;
  }
}

// ── CLEAR ─────────────────────────────────────────────
// Call on logout so next session fetches fresh
export function clearEntitlements() {
  sessionStorage.removeItem(CACHE_KEY);
  _entitlement = null;
}

// ── FEATURE GATE ──────────────────────────────────────
// Returns true if the current user can use a feature.
// Boolean features: must be true
// Numeric features (history_days): must be > 0
export function canUse(featureKey) {
  if (!_entitlement) return false;
  const val = _entitlement.features?.[featureKey];
  if (typeof val === 'boolean') return val === true;
  if (typeof val === 'number')  return val > 0;
  return false;
}

// ── LIMIT ─────────────────────────────────────────────
// Returns a numeric limit. null = unlimited.
export function getLimit(key) {
  if (!_entitlement) return 1;
  if (key === 'max_devices')   return _entitlement.max_devices ?? null;
  if (key === 'history_days')  return _entitlement.features?.history_days ?? 1;
  return null;
}

// ── PLAN INFO ─────────────────────────────────────────
export function getPlan() {
  return {
    name:       _entitlement?.plan_name || null,
    fee:        _entitlement?.monthly_fee || 0,
    status:     _entitlement?.status || 'active',
    maxDevices: _entitlement?.max_devices ?? 1
  };
}

// ── UPGRADE PROMPT ────────────────────────────────────
// Returns a user-facing message for blocked features.
export function upgradeMessage(featureKey) {
  const messages = {
    geofencing:       'Geofencing is available on Business and Enterprise plans.',
    custom_geofences: 'Custom geofences are available on the Enterprise plan.',
    alerts_whatsapp:  'WhatsApp alerts are available on Business and Enterprise plans.',
    speed_alerts:     'Speed alerts are available on Business and Enterprise plans.',
    history_days:     'Extended history is available on Business and Enterprise plans.',
    report_export:    'Report export is available on the Enterprise plan.',
    multi_user:       'Multi-user access is available on the Enterprise plan.',
    api_access:       'API access is available on the Enterprise plan.'
  };
  return messages[featureKey] || 'This feature requires a plan upgrade. Contact support.';
}
