// =====================================================
// SHERKALL INTELLIGENCE — VEHICLE LIST UI MODULE
// js/ui/vehicleList.js
// =====================================================
// Key improvement: diff-based rendering.
// Only DOM nodes that actually changed get rebuilt.
// At 20 vehicles × 3 pushes/sec = 60 potential renders
// reduced to only changed vehicles.

import { vehicleStore, selectedId } from '../state.js';
import { CONFIG }                   from '../config.js';

// Track last render state per vehicle to detect changes
const renderCache = new Map(); // vehicleId → hash string

function getHash(v) {
  return `${v.status}|${v.speed}|${String(v.id) === String(selectedId)}`;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildItem(v) {
  const isMoving  = v.speed > CONFIG.SPEED_THRESHOLD;
  const isOnline  = v.status === 'online' || v.status === 'idle';
  const isSelected = String(v.id) === String(selectedId);
  const statusCls = isMoving ? 'status-moving' : isOnline ? 'status-idle' : 'status-offline';
  const statusTxt = isMoving ? `Moving · ${v.speed} km/h` : isOnline ? 'Parked' : 'Offline';

  const li = document.createElement('li');
  li.className = `veh-item${isSelected ? ' selected' : ''}`;
  li.dataset.vehicleId = v.id;
  li.innerHTML = `
    <div class="veh-avatar ${statusCls}">
      ${escHtml(v.name.charAt(0).toUpperCase())}
    </div>
    <div class="veh-info">
      <p class="veh-name"></p>
      <p class="veh-status ${statusCls}">${escHtml(statusTxt)}</p>
    </div>
    <div class="veh-actions">
      <button class="locate-btn" title="Locate">◎</button>
    </div>`;
  li.querySelector('.veh-name').textContent = v.name;
  return li;
}

export function renderVehicleList() {
  const ul = document.getElementById('vehicle-list');
  if (!ul) return;

  const q = (document.getElementById('vehicle-filter')?.value || '').toLowerCase();

  const vehicles = Object.values(vehicleStore)
    .filter(v => !q || v.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const o = { online: 0, idle: 1, offline: 2 };
      return (o[a.status] ?? 2) - (o[b.status] ?? 2);
    });

  if (!vehicles.length) {
    ul.innerHTML = '<li class="empty-list">Aucun véhicule trouvé</li>';
    renderCache.clear();
    return;
  }

  // ── DIFF: remove items no longer present ─────────────
  const currentIds = new Set(vehicles.map(v => String(v.id)));
  Array.from(ul.querySelectorAll('[data-vehicle-id]')).forEach(el => {
    if (!currentIds.has(el.dataset.vehicleId)) {
      el.remove();
      renderCache.delete(el.dataset.vehicleId);
    }
  });

  // ── DIFF: add or update only changed items ────────────
  vehicles.forEach(v => {
    const hash       = getHash(v);
    const cachedHash = renderCache.get(String(v.id));
    const existing   = ul.querySelector(`[data-vehicle-id="${v.id}"]`);

    if (existing && cachedHash === hash) return; // unchanged — skip DOM work

    const li = buildItem(v);
    if (existing) ul.replaceChild(li, existing);
    else          ul.appendChild(li);

    renderCache.set(String(v.id), hash);
  });
}
