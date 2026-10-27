/**
 * Locafy — Search & Discovery Controller with Leaflet Map
 */

let map = null;
let markersLayer = null;
let currentResults = [];
let userLocation = { lat: 28.6139, lng: 77.2090 }; // Delhi fallback

async function initSearchPage() {
  initMap();
  setupFilterListeners();
  await loadCategoriesFilter();

  // Read URL query parameters
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const cat = params.get('category') || '';
  const city = params.get('city') || '';
  const lat = params.get('lat');
  const lng = params.get('lng');

  if (lat && lng) {
    userLocation.lat = parseFloat(lat);
    userLocation.lng = parseFloat(lng);
  }

  const searchInput = document.getElementById('searchInput');
  const cityInput = document.getElementById('cityInput');
  const catSelect = document.getElementById('categoryFilter');

  if (searchInput) searchInput.value = q;
  if (cityInput) cityInput.value = city;
  if (catSelect && cat) catSelect.value = cat;

  executeSearch(1);
}

function initMap() {
  const mapContainer = document.getElementById('searchMap');
  if (!mapContainer || typeof L === 'undefined') return;

  map = L.map('searchMap').setView([userLocation.lat, userLocation.lng], 12);

  // High-resolution real street map (CartoDB Voyager - beautiful, fast, zero 403 blocks)
  const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });

  // High-resolution satellite view (ESRI World Imagery)
  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  });

  streetLayer.addTo(map);

  const baseMaps = {
    '🗺️ Street Map': streetLayer,
    '🛰️ Satellite View': satelliteLayer
  };

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

async function loadCategoriesFilter() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  try {
    const data = await api.get('/categories');
    if (data.categories) {
      data.categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.slug;
        opt.textContent = `${cat.name} (${cat.business_count || 0})`;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.warn('Failed to load category filters:', e);
  }
}

function setupFilterListeners() {
  let debounce = null;
  const searchInput = document.getElementById('searchInput');
  const cityInput = document.getElementById('cityInput');
  const catFilter = document.getElementById('categoryFilter');
  const radiusFilter = document.getElementById('radiusFilter');
  const sortFilter = document.getElementById('sortFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const openNowFilter = document.getElementById('openNowFilter');
  const verifiedFilter = document.getElementById('verifiedFilter');

  const triggerSearch = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => executeSearch(1), 300);
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounce);
      executeSearch(1);
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', triggerSearch);
    searchInput.addEventListener('keydown', handleEnter);
  }
  if (cityInput) {
    cityInput.addEventListener('input', triggerSearch);
    cityInput.addEventListener('keydown', handleEnter);
  }
  if (catFilter) catFilter.addEventListener('change', () => executeSearch(1));
  if (radiusFilter) radiusFilter.addEventListener('change', () => executeSearch(1));
  if (sortFilter) sortFilter.addEventListener('change', () => executeSearch(1));
  if (ratingFilter) ratingFilter.addEventListener('change', () => executeSearch(1));
  if (openNowFilter) openNowFilter.addEventListener('change', () => executeSearch(1));
  if (verifiedFilter) verifiedFilter.addEventListener('change', () => executeSearch(1));
}

async function executeSearch(page = 1) {
  const resultsContainer = document.getElementById('searchResults');
  const countEl = document.getElementById('resultsCount');
  const paginationEl = document.getElementById('searchPagination');

  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>
    `;
  }

  const q = document.getElementById('searchInput')?.value.trim() || '';
  const city = document.getElementById('cityInput')?.value.trim() || '';
  const category = document.getElementById('categoryFilter')?.value || '';
  const radius_km = document.getElementById('radiusFilter')?.value || '';
  const sort = document.getElementById('sortFilter')?.value || 'distance';
  const min_rating = document.getElementById('ratingFilter')?.value || '';
  const open_now = document.getElementById('openNowFilter')?.checked ? 'true' : '';
  const verified = document.getElementById('verifiedFilter')?.checked ? 'true' : '';

  const params = {
    q,
    city,
    category,
    radius_km,
    sort,
    min_rating,
    open_now,
    verified,
    lat: userLocation.lat,
    lng: userLocation.lng,
    page,
    limit: 10
  };

  try {
    const data = await api.get('/businesses', params);
    currentResults = data.businesses || [];

    if (countEl) {
      countEl.textContent = `${data.total} verified place${data.total === 1 ? '' : 's'} found`;
    }

    renderResults(currentResults, resultsContainer);
    renderMapMarkers(currentResults);
    renderPagination(data.page, data.totalPages, paginationEl);
  } catch (err) {
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <h3>Error searching businesses</h3>
          <p>${api.escapeHtml(err.message)}</p>
          <button class="btn btn-primary" onclick="executeSearch(1)">Try again</button>
        </div>
      `;
    }
  }
}

function renderResults(businesses, container) {
  if (!container) return;

  if (businesses.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div>
        <h3>No businesses found nearby</h3>
        <p>Try broadening your distance radius, removing filters, or searching a different keyword.</p>
        <button class="btn btn-ghost" onclick="resetFilters()">Reset all filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = businesses
    .map(
      (b) => `
    <div class="biz-card search-biz-card" id="biz-card-${b.id}" onmouseenter="highlightMarker(${b.id})" onmouseleave="unhighlightMarker(${b.id})">
      <div class="biz-img">
        <a href="business.html?id=${b.id}">
          <img class="biz-img-inner" src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop'}" alt="${api.escapeHtml(b.name)}" loading="lazy">
        </a>
        <span class="biz-badge ${b.is_open ? '' : 'closed'}">
          ${b.is_open ? '<span class="dot-live"></span>Open now' : 'Closed'}
        </span>
        <button type="button" class="biz-fav-btn ${b.is_favourited ? 'active' : ''}" onclick="toggleFav(${b.id}, this)" title="Bookmark">
          <svg viewBox="0 0 24 24" fill="${b.is_favourited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="biz-body">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="biz-cat">${api.escapeHtml(b.category_name)}</span>
          ${b.is_verified ? '<span class="badge-verified-pill"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Verified</span>' : ''}
        </div>
        <a href="business.html?id=${b.id}" class="biz-name">${api.escapeHtml(b.name)}</a>
        <p style="font-size:12.5px;color:var(--muted);margin-bottom:8px;line-height:1.4;">${api.escapeHtml(b.address)}</p>
        <div class="biz-meta">
          <span class="rating">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
            ${b.avg_rating ? b.avg_rating.toFixed(1) : 'New'} (${b.review_count || 0})
          </span>
          <span>${api.formatDistance(b.distance_km)}</span>
        </div>
        
        <div class="card-actions-row">
          <button type="button" class="card-action-btn" onclick="handleTrackAndAction(${b.id}, 'call', '${api.escapeHtml(b.phone)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </button>
          <button type="button" class="card-action-btn wa" onclick="handleTrackAndAction(${b.id}, 'whatsapp', '${api.escapeHtml(b.whatsapp || b.phone)}')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            WhatsApp
          </button>
          <button type="button" class="card-action-btn" onclick="handleTrackAndAction(${b.id}, 'directions', {lat:${b.lat}, lng:${b.lng}})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Directions
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

const mapMarkers = {};

function renderMapMarkers(businesses) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();
  Object.keys(mapMarkers).forEach((k) => delete mapMarkers[k]);

  if (businesses.length === 0) return;

  const bounds = [];

  businesses.forEach((b) => {
    if (b.lat && b.lng) {
      const pinBg = b.category_color || 'var(--orange)';
      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `<div style="background:${pinBg};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 4px 14px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;border-radius:50%;background:#fff;transform:rotate(45deg);"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([b.lat, b.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family:var(--font-body);padding:2px;max-width:200px;">
          <img src="${b.image_url}" style="width:100%;height:85px;object-fit:cover;border-radius:8px;margin-bottom:6px;">
          <div style="font-size:10px;font-family:var(--font-mono);color:var(--blue);text-transform:uppercase;font-weight:700;">${api.escapeHtml(b.category_name)}</div>
          <b style="font-size:13px;display:block;margin:2px 0 4px;color:var(--ink);">${api.escapeHtml(b.name)}</b>
          <div style="font-size:11px;color:var(--orange);font-weight:600;margin-bottom:6px;">★ ${b.avg_rating.toFixed(1)} · ${api.formatDistance(b.distance_km)}</div>
          <a href="business.html?id=${b.id}" class="btn btn-primary btn-sm btn-block" style="font-size:11px;padding:5px 8px;">View Details</a>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
      mapMarkers[b.id] = marker;
      bounds.push([b.lat, b.lng]);
    }
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }
}

function highlightMarker(id) {
  const marker = mapMarkers[id];
  if (marker && map) {
    marker.openPopup();
  }
}

function unhighlightMarker(id) {
  // Optional popup close
}

async function handleTrackAndAction(businessId, type, target) {
  await api.track(businessId, type);

  if (type === 'call') {
    const cleanPhone = String(target).replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  } else if (type === 'whatsapp') {
    const cleanPhone = String(target).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=Hi%2C%20I%20found%20your%20business%20on%20Locafy`, '_blank');
  } else if (type === 'directions') {
    const { lat, lng } = target;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }
}

async function toggleFav(businessId, btn) {
  const user = api.getUser();
  if (!user) {
    showToast('Please log in to save favourites', 'info');
    setTimeout(() => {
      window.location.href = 'auth-user.html';
    }, 800);
    return;
  }

  const isActive = btn.classList.contains('active');
  try {
    if (isActive) {
      await api.delete(`/me/favourites/${businessId}`);
      btn.classList.remove('active');
      btn.querySelector('svg').setAttribute('fill', 'none');
      showToast('Removed from favourites', 'info');
    } else {
      await api.post(`/me/favourites/${businessId}`);
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
      showToast('Saved to favourites', 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderPagination(currentPage, totalPages, container) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn-ghost btn-sm" ${currentPage <= 1 ? 'disabled' : ''} onclick="executeSearch(${currentPage - 1})">← Prev</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `
        <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-ghost'}" onclick="executeSearch(${i})">${i}</button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="padding:0 4px;color:var(--muted);">…</span>`;
    }
  }

  html += `
    <button class="btn btn-ghost btn-sm" ${currentPage >= totalPages ? 'disabled' : ''} onclick="executeSearch(${currentPage + 1})">Next →</button>
  `;

  container.innerHTML = html;
}

function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  const cityInput = document.getElementById('cityInput');
  const catFilter = document.getElementById('categoryFilter');
  const radiusFilter = document.getElementById('radiusFilter');
  const sortFilter = document.getElementById('sortFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const openNowFilter = document.getElementById('openNowFilter');
  const verifiedFilter = document.getElementById('verifiedFilter');

  if (searchInput) searchInput.value = '';
  if (cityInput) cityInput.value = '';
  if (catFilter) catFilter.value = '';
  if (radiusFilter) radiusFilter.value = '';
  if (sortFilter) sortFilter.value = 'distance';
  if (ratingFilter) ratingFilter.value = '';
  if (openNowFilter) openNowFilter.checked = false;
  if (verifiedFilter) verifiedFilter.checked = false;

  executeSearch(1);
}

document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

window.executeSearch = executeSearch;
window.handleTrackAndAction = handleTrackAndAction;
window.toggleFav = toggleFav;
window.highlightMarker = highlightMarker;
window.unhighlightMarker = unhighlightMarker;
window.resetFilters = resetFilters;
