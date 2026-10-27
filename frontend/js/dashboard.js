/**
 * Locafy — Business Owner Dashboard Controller
 */

let leadsChart = null;
let currentRange = '7d';
let myBusinesses = [];
let pinPickerMap = null;
let pinPickerMarker = null;
let selectedBusinessId = null;

async function initDashboard() {
  if (!auth.requireAuth('business')) return;

  await loadOwnerBusinesses();
  await loadCategoriesDropdown();
  await loadAnalytics(currentRange);
  await loadOwnerMessages();
}

async function loadOwnerBusinesses() {
  const container = document.getElementById('myListingsContainer');
  if (!container) return;

  try {
    const data = await api.get('/owner/businesses');
    myBusinesses = data.businesses || [];

    if (myBusinesses.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px;">
          <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
          <h3>No listings created yet</h3>
          <p>Create your first business listing to get verified and start receiving leads.</p>
          <button class="btn btn-primary" onclick="openAddListingModal()">+ Add New Listing</button>
        </div>
      `;
      return;
    }

    // Default select first business for analytics if none selected
    if (!selectedBusinessId && myBusinesses.length > 0) {
      selectedBusinessId = myBusinesses[0].id;
    }

    container.innerHTML = myBusinesses
      .map(
        (b) => `
      <div class="listing-item-card ${b.id === selectedBusinessId ? 'selected-biz' : ''}" onclick="selectBizForAnalytics(${b.id})">
        <img class="listing-thumb" src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=140&fit=crop'}" alt="${api.escapeHtml(b.name)}">
        <div class="listing-details">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
            <span class="biz-cat">${api.escapeHtml(b.category_name)}</span>
            <span class="badge-status ${b.status}">${api.escapeHtml(b.status)}</span>
            ${b.is_verified ? '<span class="badge-verified-pill"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Verified</span>' : ''}
          </div>
          <h4 style="font-size:16px;margin:0 0 4px;color:var(--ink);">${api.escapeHtml(b.name)}</h4>
          <p style="font-size:12.5px;color:var(--muted);">${api.escapeHtml(b.address)}, ${api.escapeHtml(b.city)}</p>
          <div style="display:flex;align-items:center;gap:12px;font-size:12px;margin-top:8px;color:var(--ink-soft);">
            <span>★ <b>${b.avg_rating.toFixed(1)}</b> (${b.review_count})</span>
            <span>Leads: <b>${b.total_leads || 0}</b></span>
            ${b.unread_messages > 0 ? `<span style="color:var(--blue);font-weight:700;">${b.unread_messages} new message${b.unread_messages === 1 ? '' : 's'}</span>` : ''}
          </div>
        </div>
        <div class="listing-actions-col">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openEditListingModal(${b.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openImageUploadModal(${b.id})">Upload Photo</button>
          ${b.status === 'approved' ? `<a href="business.html?id=${b.id}" target="_blank" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">View Live</a>` : ''}
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function selectBizForAnalytics(bizId) {
  selectedBusinessId = bizId;
  loadOwnerBusinesses();
  loadAnalytics(currentRange);
}

async function loadAnalytics(range = '7d') {
  currentRange = range;
  document.querySelectorAll('.range-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });

  if (!selectedBusinessId) return;

  try {
    const data = await api.get(`/owner/businesses/${selectedBusinessId}/analytics`, { range });
    const s = data.summary;

    // Update stat cards
    const viewsEl = document.getElementById('statViews');
    const callsEl = document.getElementById('statCalls');
    const waEl = document.getElementById('statWhatsApp');
    const dirEl = document.getElementById('statDirections');
    const msgEl = document.getElementById('statMessages');
    const totalEl = document.getElementById('statTotalLeads');

    if (viewsEl) viewsEl.textContent = s.views || 0;
    if (callsEl) callsEl.textContent = s.calls || 0;
    if (waEl) waEl.textContent = s.whatsapp || 0;
    if (dirEl) dirEl.textContent = s.directions || 0;
    if (msgEl) msgEl.textContent = s.messages || 0;
    if (totalEl) totalEl.textContent = s.total_leads || 0;

    // Render Chart.js
    renderLeadsChart(data.daily_series);
  } catch (err) {
    console.warn('Analytics load error:', err);
  }
}

function renderLeadsChart(series) {
  const canvas = document.getElementById('leadsChartCanvas');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = series.map((s) => s.label);
  const viewsData = series.map((s) => s.views);
  const actionsData = series.map((s) => s.actions);

  if (leadsChart) {
    leadsChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  leadsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Customer Actions (Calls, WhatsApp, Directions)',
          data: actionsData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#10B981',
          pointRadius: 4
        },
        {
          label: 'Profile Views',
          data: viewsData,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.06)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#2563EB',
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Plus Jakarta Sans', size: 12 } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, font: { family: 'JetBrains Mono', size: 11 } },
          grid: { color: 'rgba(226, 232, 240, 0.6)' }
        },
        x: {
          ticks: { font: { family: 'JetBrains Mono', size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

async function loadOwnerMessages() {
  const container = document.getElementById('inboxMessagesList');
  if (!container) return;

  try {
    const data = await api.get('/owner/messages');
    const messages = data.messages || [];

    if (messages.length === 0) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);">No customer enquiries received yet.</div>`;
      return;
    }

    container.innerHTML = messages
      .map(
        (m) => `
      <div class="inbox-msg-item ${m.status === 'new' ? 'unread' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div>
            <b style="font-size:14px;color:var(--ink);">${api.escapeHtml(m.name)}</b>
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--blue);margin-left:8px;">${api.escapeHtml(m.business_name)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="review-date">${api.formatDate(m.created_at)}</span>
            ${m.status === 'new' ? '<span class="badge-status pending" style="padding:2px 6px;font-size:10px;">NEW</span>' : ''}
          </div>
        </div>
        <div style="display:flex;gap:16px;font-size:12.5px;color:var(--muted);margin-bottom:8px;">
          <span>📞 <a href="tel:${api.escapeHtml(m.phone)}" style="color:var(--blue);">${api.escapeHtml(m.phone)}</a></span>
          ${m.email ? `<span>✉️ <a href="mailto:${api.escapeHtml(m.email)}" style="color:var(--blue);">${api.escapeHtml(m.email)}</a></span>` : ''}
        </div>
        <p style="font-size:13.5px;color:var(--ink-soft);background:var(--bg-soft);padding:10px 12px;border-radius:8px;line-height:1.5;">${api.escapeHtml(m.body)}</p>
        ${
          m.status === 'new'
            ? `<div style="text-align:right;margin-top:6px;">
            <button type="button" class="btn btn-ghost btn-sm" onclick="markRead(${m.id})">Mark as read</button>
          </div>`
            : ''
        }
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.warn('Failed to load owner messages:', err);
  }
}

async function markRead(messageId) {
  try {
    await api.patch(`/owner/messages/${messageId}/read`);
    showToast('Message marked as read', 'success');
    loadOwnerMessages();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadCategoriesDropdown() {
  const select = document.getElementById('bizCategoryInput');
  if (!select) return;

  try {
    const data = await api.get('/categories');
    if (data.categories) {
      select.innerHTML = data.categories.map((c) => `<option value="${c.id}">${api.escapeHtml(c.name)}</option>`).join('');
    }
  } catch (e) {
    console.warn('Categories load error:', e);
  }
}

/**
 * Leaflet Pin Picker for lat/lng
 */
function initPinPicker(lat = 28.57, lng = 77.32) {
  const container = document.getElementById('pinPickerMap');
  if (!container || typeof L === 'undefined') return;

  if (!pinPickerMap) {
    pinPickerMap = L.map('pinPickerMap').setView([lat, lng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(pinPickerMap);

    pinPickerMarker = L.marker([lat, lng], { draggable: true }).addTo(pinPickerMap);

    pinPickerMarker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      document.getElementById('bizLatInput').value = pos.lat.toFixed(5);
      document.getElementById('bizLngInput').value = pos.lng.toFixed(5);
    });

    pinPickerMap.on('click', function (e) {
      pinPickerMarker.setLatLng(e.latlng);
      document.getElementById('bizLatInput').value = e.latlng.lat.toFixed(5);
      document.getElementById('bizLngInput').value = e.latlng.lng.toFixed(5);
    });
  } else {
    pinPickerMap.setView([lat, lng], 13);
    pinPickerMarker.setLatLng([lat, lng]);
    setTimeout(() => pinPickerMap.invalidateSize(), 200);
  }
}

/**
 * Modal management
 */
function openAddListingModal() {
  document.getElementById('listingModalTitle').textContent = 'Create New Business Listing';
  document.getElementById('listingForm').reset();
  document.getElementById('listingEditId').value = '';

  const modal = document.getElementById('listingModal');
  modal.classList.add('show');

  const defaultLat = 28.57;
  const defaultLng = 77.32;
  document.getElementById('bizLatInput').value = defaultLat;
  document.getElementById('bizLngInput').value = defaultLng;
  setTimeout(() => initPinPicker(defaultLat, defaultLng), 250);
}

function openEditListingModal(bizId) {
  const biz = myBusinesses.find((b) => b.id === bizId);
  if (!biz) return;

  document.getElementById('listingModalTitle').textContent = 'Edit Business Listing';
  document.getElementById('listingEditId').value = biz.id;
  document.getElementById('bizNameInput').value = biz.name;
  document.getElementById('bizCategoryInput').value = biz.category_id;
  document.getElementById('bizPhoneInput').value = biz.phone;
  document.getElementById('bizWhatsAppInput').value = biz.whatsapp || '';
  document.getElementById('bizEmailInput').value = biz.email || '';
  document.getElementById('bizWebsiteInput').value = biz.website || '';
  document.getElementById('bizAddressInput').value = biz.address;
  document.getElementById('bizAreaInput').value = biz.area || '';
  document.getElementById('bizCityInput').value = biz.city;
  document.getElementById('bizPincodeInput').value = biz.pincode || '';
  document.getElementById('bizDescriptionInput').value = biz.description || '';
  document.getElementById('bizLatInput').value = biz.lat;
  document.getElementById('bizLngInput').value = biz.lng;

  const modal = document.getElementById('listingModal');
  modal.classList.add('show');
  setTimeout(() => initPinPicker(biz.lat, biz.lng), 250);
}

function closeListingModal() {
  const modal = document.getElementById('listingModal');
  if (modal) modal.classList.remove('show');
}

async function saveListing(e) {
  e.preventDefault();
  const id = document.getElementById('listingEditId').value;
  const btn = document.getElementById('saveListingBtn');

  const payload = {
    name: document.getElementById('bizNameInput').value.trim(),
    category_id: parseInt(document.getElementById('bizCategoryInput').value, 10),
    phone: document.getElementById('bizPhoneInput').value.trim(),
    whatsapp: document.getElementById('bizWhatsAppInput').value.trim(),
    email: document.getElementById('bizEmailInput').value.trim(),
    website: document.getElementById('bizWebsiteInput').value.trim(),
    address: document.getElementById('bizAddressInput').value.trim(),
    area: document.getElementById('bizAreaInput').value.trim(),
    city: document.getElementById('bizCityInput').value.trim(),
    pincode: document.getElementById('bizPincodeInput').value.trim(),
    description: document.getElementById('bizDescriptionInput').value.trim(),
    lat: parseFloat(document.getElementById('bizLatInput').value),
    lng: parseFloat(document.getElementById('bizLngInput').value)
  };

  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    if (id) {
      await api.put(`/owner/businesses/${id}`, payload);
      showToast('Business listing updated successfully', 'success');
    } else {
      await api.post('/owner/businesses', payload);
      showToast('Listing submitted! Pending admin verification.', 'success');
    }
    closeListingModal();
    await loadOwnerBusinesses();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Listing';
  }
}

/**
 * Image Upload Modal
 */
let uploadTargetBizId = null;
function openImageUploadModal(bizId) {
  uploadTargetBizId = bizId;
  const modal = document.getElementById('imageUploadModal');
  if (modal) modal.classList.add('show');
}

function closeImageUploadModal() {
  const modal = document.getElementById('imageUploadModal');
  if (modal) modal.classList.remove('show');
}

async function handlePhotoUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('photoFileInput');
  if (!fileInput || !fileInput.files[0]) {
    showToast('Please select an image file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  const btn = document.getElementById('uploadPhotoBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  try {
    await api.upload(`/owner/businesses/${uploadTargetBizId}/images`, formData);
    showToast('Photo uploaded and set as cover image!', 'success');
    closeImageUploadModal();
    loadOwnerBusinesses();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Image';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

window.openAddListingModal = openAddListingModal;
window.openEditListingModal = openEditListingModal;
window.closeListingModal = closeListingModal;
window.saveListing = saveListing;
window.openImageUploadModal = openImageUploadModal;
window.closeImageUploadModal = closeImageUploadModal;
window.handlePhotoUpload = handlePhotoUpload;
window.selectBizForAnalytics = selectBizForAnalytics;
window.loadAnalytics = loadAnalytics;
window.markRead = markRead;
