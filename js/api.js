// =====================================================
// SHERKALL INTELLIGENCE — API MODULE
// js/api.js
// =====================================================
// All backend fetch calls in one place.
// Adding new SaaS endpoints = add here only.

import { BACKEND_URL } from './config.js';
import { getToken }    from './auth.js';

function headers() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

// ── VEHICLES ─────────────────────────────────────────
export async function fetchVehicles() {
  const res = await fetch(`${BACKEND_URL}/api/vehicles`, { headers: headers() });
  if (!res.ok) throw new Error(`fetchVehicles: ${res.status}`);
  return res.json();
}

export async function fetchPositions() {
  const res = await fetch(`${BACKEND_URL}/api/vehicles/positions`, { headers: headers() });
  if (!res.ok) throw new Error(`fetchPositions: ${res.status}`);
  return res.json();
}

// ── GEOFENCES ─────────────────────────────────────────
export async function fetchGeofences() {
  const res = await fetch(`${BACKEND_URL}/api/geofences`, { headers: headers() });
  if (!res.ok) throw new Error(`fetchGeofences: ${res.status}`);
  return res.json();
}

// ── SSE STREAM URL ────────────────────────────────────
// EventSource cannot set headers — token passed as query param.
export function getStreamUrl() {
  return `${BACKEND_URL}/api/vehicles/stream?token=${encodeURIComponent(getToken())}`;
}
