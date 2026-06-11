// =====================================================
// SHERKALL INTELLIGENCE — REALTIME MODULE
// js/realtime.js
// =====================================================
// SSE connection with polling fallback.
// Geofence alerts arrive as named SSE events.

import { CONFIG }           from './config.js';
import { getStreamUrl }     from './api.js';
import { fetchPositions }   from './api.js';
import { processPositions } from './state.js';

let sseConnection = null;
let pollingTimer  = null;
let onConnected   = () => {};
let onGeofence    = () => {};

// ── INIT ──────────────────────────────────────────────
export function initRealtime(callbacks = {}) {
  if (callbacks.onConnected) onConnected = callbacks.onConnected;
  if (callbacks.onGeofence)  onGeofence  = callbacks.onGeofence;
  startSSE();
}

// ── SSE ───────────────────────────────────────────────
function startSSE() {
  try {
    sseConnection = new EventSource(getStreamUrl());

    sseConnection.onopen = () => onConnected(true);

    sseConnection.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.positions) processPositions(data.positions);
        onConnected(true);
      } catch {}
    };

    // Named event for geofence entry/exit alerts
    sseConnection.addEventListener('geofence', (e) => {
      try { onGeofence(JSON.parse(e.data)); } catch {}
    });

    sseConnection.onerror = () => {
      sseConnection?.close();
      sseConnection = null;
      onConnected(false);
      // Reconnect after delay instead of permanent polling fallback
      setTimeout(() => { if (!sseConnection) startSSE(); }, CONFIG.RETRY_DELAY);
    };

  } catch {
    startPolling();
  }
}

// ── POLLING FALLBACK ──────────────────────────────────
function startPolling() {
  if (sseConnection || pollingTimer) return;
  pollingTimer = setInterval(async () => {
    try {
      const data = await fetchPositions();
      if (data.success) {
        processPositions(data.positions || []);
        onConnected(true);
      }
    } catch { onConnected(false); }
  }, CONFIG.POLLING_INTERVAL);
}

// ── CLEANUP ───────────────────────────────────────────
export function stopRealtime() {
  if (sseConnection) { sseConnection.close(); sseConnection = null; }
  if (pollingTimer)  { clearInterval(pollingTimer); pollingTimer = null; }
}
