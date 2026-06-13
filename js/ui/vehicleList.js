// =====================================================
// SHERKALL INTELLIGENCE — VEHICLE LIST UI MODULE
// js/ui/vehicleList.js
// =====================================================
// Rebuilt from original dashboard-1.js renderVehicleList
// Preserves exact HTML structure, CSS classes, and behaviour

import { vehicleStore, selectedId, getVehicleStatus } from '../state.js';
import { CONFIG } from '../config.js';

// ── RENDER CACHE (diff-based) ─────────────────────────
const renderCache = new Map(); // vehicleId → hash

function getHash(v) {
  return `${getVehicleStatus(v)}|${v.speed}|${String(v.id) === String(selectedId)}|${v.ts}`;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderVehicleList() {
  const ul = document.getElementById('vehicle-list');
  if (!ul) return;

  const q = (document.getElementById('vehicle-filter')?.value || '').toLowerCase();

  const vehicles = Object.values(vehicleStore)
    .filter(v => !q || v.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const order = { online: 0, idle: 1, offline: 2 };
      return (order[getVehicleStatus(a)] ?? 2) - (order[getVehicleStatus(b)] ?? 2);
    });

  if (!vehicles.length) {
    ul.innerHTML = '<li style="padding:24px;text-align:center;color:var(--grey);font-size:13px;">Aucun véhicule trouvé</li>';
    renderCache.clear();
    return;
  }

  // ── DIFF: remove items no longer in list ──────────────
  const currentIds = new Set(vehicles.map(v => String(v.id)));
  Array.from(ul.querySelectorAll('[data-vehicle-id]')).forEach(el => {
    if (!currentIds.has(el.dataset.vehicleId)) {
      el.remove();
      renderCache.delete(el.dataset.vehicleId);
    }
  });

  // ── DIFF: add or update only changed items ────────────
  vehicles.forEach((v, index) => {
    const hash     = getHash(v);
    const existing = ul.querySelector(`[data-vehicle-id="${v.id}"]`);

    if (existing && renderCache.get(String(v.id)) === hash) return; // unchanged

    const li = buildItem(v);

    if (existing) {
      ul.replaceChild(li, existing);
    } else {
      // Insert in sorted position
      const items = ul.querySelectorAll('[data-vehicle-id]');
      if (items[index]) ul.insertBefore(li, items[index]);
      else ul.appendChild(li);
    }

    renderCache.set(String(v.id), hash);
  });
}

function buildItem(v) {
  const status   = getVehicleStatus(v);
  const isMoving = v.speed > CONFIG.SPEED_THRESHOLD;
  const isOnline = status === 'online' || status === 'idle';
  const statusCls = isMoving ? 'status-moving' : isOnline ? 'status-idle' : 'status-offline';
  const statusTxt = isMoving ? `Moving · ${v.speed} km/h` : isOnline ? 'Parked' : 'Offline';

  const ts = v.ts
    ? new Date(v.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' ago'
    : '—';

  const li = document.createElement('li');
  li.className = `veh-item ${statusCls}${String(v.id) === String(selectedId) ? ' selected' : ''}`;
  li.dataset.vehicleId = v.id;

  // Exact same HTML structure as original dashboard-1.js
  li.innerHTML = `
    <div class="veh-item-top">
      <span class="veh-name"></span>
      <span class="veh-ts">${escHtml(ts)}</span>
    </div>
    <div class="veh-status-row">
      <span class="veh-status-dot"></span>
      <span class="veh-status-text">${escHtml(statusTxt)}</span>
    </div>
    <div class="veh-item-bottom">
      <div class="veh-meta">
        <div class="veh-meta-item">
          <span class="veh-meta-label">Speed</span>
          <span class="veh-meta-value">${v.speed || 0} km/h</span>
        </div>
        <div class="veh-meta-item">
          <span class="veh-meta-label">Signal</span>
          <span class="veh-meta-value">${status === 'offline' ? '—' : 'OK'}</span>
        </div>
      </div>
      <div class="veh-actions">
        <button class="veh-action-btn locate-btn" title="Locate on map">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2a8 8 0 010 16m0 0v4"/>
          </svg>
        </button>
        <button class="veh-action-btn history-btn" title="History">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </div>`;

  // Set name safely — no XSS
  li.querySelector('.veh-name').textContent = v.name;

  return li;
}
