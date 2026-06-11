// =====================================================
// SHERKALL INTELLIGENCE — CONFIG
// js/config.js
// =====================================================
// Single source of truth for all constants.
// White-label: change BACKEND_URL per tenant deployment.

export const BACKEND_URL = 'https://sherkall-backend-production.up.railway.app';

export const CONFIG = {
  SPEED_THRESHOLD:    3,       // km/h — moving vs idle
  SPEEDING_THRESHOLD: 90,      // km/h — alert trigger
  ONLINE_WINDOW_MS:   90000,   // 90s — offline detection
  POLLING_INTERVAL:   5000,    // ms — fallback polling
  RETRY_DELAY:        3000,    // ms — SSE reconnect delay
  RENDER_DEBOUNCE:    100,     // ms — batch UI updates
};

export const TILE_LAYERS = {
  street: {
    url:     'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: '© OpenStreetMap', subdomains: 'abc' }
  },
  satellite: {
    url:     'https://mt{s}.google.com/vt/lyrs=y&hl=fr&x={x}&y={y}&z={z}',
    options: { maxZoom: 20, attribution: '© Google', subdomains: ['0','1','2','3'] }
  }
};