/**
 * Locafy — Business Listing Detail Controller
 */

let businessData = null;
let listingMap = null;

async function initListingPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.href = 'search.html';
    return;
  }

  await loadBusinessDetails(id);
}

async function loadBusinessDetails(id) {
  const container = document.getElementById('listingContainer');

  try {
    const data = await api.get(`/businesses/${id}`);
    businessData = data.business;
    document.title = `${businessData.name} — Locafy`;

    renderBusiness(businessData);
    initListingMap(businessData);
    generateQRCode();
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <h3>Business not found</h3>
          <p>${api.escapeHtml(err.message)}</p>
          <a href="search.html" class="btn btn-primary">Back to search</a>
        </div>
      `;
    }
  }
}

function renderBusiness(b) {
  // Breadcrumb
  const catBreadcrumb = document.getElementById('catBreadcrumb');
  const nameBreadcrumb = document.getElementById('nameBreadcrumb');
  if (catBreadcrumb) {
    catBreadcrumb.textContent = b.category_name;
    catBreadcrumb.href = `search.html?category=${encodeURIComponent(b.category_slug)}`;
  }
  if (nameBreadcrumb) nameBreadcrumb.textContent = b.name;

  // Header
  const titleEl = document.getElementById('bizTitle');
  const catBadge = document.getElementById('bizCategoryBadge');
  const verBadge = document.getElementById('bizVerifiedBadge');
  const ratingEl = document.getElementById('bizRating');
  const addressEl = document.getElementById('bizAddress');
  const openBadge = document.getElementById('bizOpenBadge');
  const favBtn = document.getElementById('bizFavBtn');

  if (titleEl) titleEl.textContent = b.name;
  if (catBadge) catBadge.textContent = b.category_name;
  if (verBadge) verBadge.style.display = b.is_verified ? 'inline-flex' : 'none';
  if (addressEl) addressEl.textContent = b.address;

  if (openBadge) {
    openBadge.className = `biz-badge ${b.is_open ? '' : 'closed'}`;
    openBadge.innerHTML = b.is_open ? '<span class="dot-live"></span> Open Now' : 'Closed Now';
  }

  if (ratingEl) {
    ratingEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
      <b>${b.avg_rating ? b.avg_rating.toFixed(1) : 'New'}</b>
      <span>(${b.review_count || 0} customer reviews)</span>
    `;
  }

  if (favBtn) {
    favBtn.classList.toggle('active', Boolean(b.is_favourited));
    favBtn.querySelector('svg').setAttribute('fill', b.is_favourited ? 'currentColor' : 'none');
  }

  // Gallery
  const galleryWrap = document.getElementById('bizGalleryGrid');
  if (galleryWrap) {
    const images = b.gallery && b.gallery.length > 0 ? b.gallery : [b.image_url];
    galleryWrap.innerHTML = images
      .map(
        (img, idx) => `
      <div class="gallery-item ${idx === 0 ? 'main' : ''}" onclick="openGalleryModal('${img}')">
        <img src="${img}" alt="${api.escapeHtml(b.name)}" loading="lazy">
      </div>
    `
      )
      .join('');
  }

  // Description
  const descEl = document.getElementById('bizDescription');
  if (descEl) {
    descEl.textContent = b.description || 'Welcome to our business! Contact us directly for enquiries and service details.';
  }

  // Contact Info
  const phoneLink = document.getElementById('bizPhoneLink');
  const waLink = document.getElementById('bizWaLink');
  const emailLink = document.getElementById('bizEmailLink');
  const webLink = document.getElementById('bizWebLink');

  if (phoneLink) {
    phoneLink.textContent = b.phone || 'Not available';
    phoneLink.href = `tel:${String(b.phone).replace(/[^0-9+]/g, '')}`;
  }
  if (waLink) {
    waLink.textContent = b.whatsapp || b.phone || 'Not available';
  }
  if (emailLink) {
    if (b.email) {
      emailLink.textContent = b.email;
      emailLink.href = `mailto:${b.email}`;
    } else {
      emailLink.parentElement.style.display = 'none';
    }
  }
  if (webLink) {
    if (b.website) {
      webLink.textContent = b.website.replace(/^https?:\/\//, '');
      webLink.href = b.website;
    } else {
      webLink.parentElement.style.display = 'none';
    }
  }

  // Opening hours table
  renderOpeningHours(b.opening_hours);

  // Reviews
  renderReviews(b.recent_reviews, b.rating_breakdown);
}

function renderOpeningHours(hours) {
  const table = document.getElementById('hoursTable');
  if (!table) return;

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const todayIndex = new Date().getDay(); // 0 is Sunday
  const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][todayIndex];

  table.innerHTML = days
    .map((d) => {
      const schedule = hours && hours[d.key];
      const isToday = d.key === todayKey;
      let text = 'Closed';
      if (schedule && !schedule.closed && schedule.open && schedule.close) {
        text = `${schedule.open} — ${schedule.close}`;
      } else if (schedule && !schedule.closed) {
        text = 'Open';
      }

      return `
      <tr class="${isToday ? 'today-row' : ''}">
        <td><b>${d.label}</b> ${isToday ? '<span class="today-tag">Today</span>' : ''}</td>
        <td style="text-align:right;">${text}</td>
      </tr>
    `;
    })
    .join('');
}

function renderReviews(reviews, breakdown) {
  const listEl = document.getElementById('reviewsList');
  if (listEl) {
    if (!reviews || reviews.length === 0) {
      listEl.innerHTML = `<div style="padding:20px;color:var(--muted);text-align:center;">No reviews yet. Be the first to share your experience!</div>`;
    } else {
      listEl.innerHTML = reviews
        .map(
          (r) => `
        <div class="review-card">
          <div class="review-head">
            <div class="review-author">
              <div class="user-avatar-circle" style="width:28px;height:28px;font-size:12px;">${r.user_name.charAt(0).toUpperCase()}</div>
              <b>${api.escapeHtml(r.user_name)}</b>
            </div>
            <span class="review-date">${api.formatDate(r.created_at)}</span>
          </div>
          <div class="rating" style="margin:6px 0;">
            ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
          </div>
          <p class="review-comment">${api.escapeHtml(r.comment || '')}</p>
        </div>
      `
        )
        .join('');
    }
  }

  // Breakdown bars
  const totalReviews = businessData.review_count || 1;
  for (let star = 5; star >= 1; star--) {
    const bar = document.getElementById(`breakdownBar${star}`);
    const count = breakdown ? breakdown[star] || 0 : 0;
    if (bar) {
      const pct = Math.round((count / totalReviews) * 100);
      bar.style.width = `${pct}%`;
    }
  }
}

function initListingMap(b) {
  const container = document.getElementById('listingMap');
  if (!container || typeof L === 'undefined' || !b.lat || !b.lng) return;

  listingMap = L.map('listingMap', { scrollWheelZoom: false }).setView([b.lat, b.lng], 15);

  const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  });

  streetLayer.addTo(listingMap);

  L.control.layers({ '🗺️ Street Map': streetLayer, '🛰️ Satellite': satelliteLayer }, null, { position: 'topright' }).addTo(listingMap);

  const customIcon = L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="background:${b.category_color || 'var(--orange)'};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(15,23,42,0.4);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;border-radius:50%;background:#fff;transform:rotate(45deg);"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34]
  });

  L.marker([b.lat, b.lng], { icon: customIcon })
    .addTo(listingMap)
    .bindPopup(`<b>${api.escapeHtml(b.name)}</b><br>${api.escapeHtml(b.address)}`)
    .openPopup();
}

/**
 * Client-side QR Code Generation using lightweight QR Canvas
 */
function generateQRCode() {
  const qrBox = document.getElementById('qrCodeContainer');
  if (!qrBox) return;

  const pageUrl = window.location.href;
  // Use public QR generator API or lightweight canvas
  qrBox.innerHTML = `
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pageUrl)}" alt="Scan to open on phone" style="border-radius:8px;margin:0 auto;" loading="lazy">
  `;
}

/**
 * Action Handlers: Call, WhatsApp, Directions
 */
async function triggerCall() {
  if (!businessData) return;
  await api.track(businessData.id, 'call');
  const cleanPhone = String(businessData.phone).replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanPhone}`;
}

async function triggerWhatsApp() {
  if (!businessData) return;
  await api.track(businessData.id, 'whatsapp');
  const cleanPhone = String(businessData.whatsapp || businessData.phone).replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(businessData.name)}%2C%20I%20found%20your%20business%20on%20Locafy`, '_blank');
}

async function triggerDirections() {
  if (!businessData) return;
  await api.track(businessData.id, 'directions');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${businessData.lat},${businessData.lng}`, '_blank');
}

/**
 * Favourite Toggle
 */
async function toggleListingFav() {
  const user = api.getUser();
  if (!user) {
    showToast('Please log in to save favourites', 'info');
    setTimeout(() => {
      window.location.href = `auth-user.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 800);
    return;
  }

  const btn = document.getElementById('bizFavBtn');
  const isFav = btn.classList.contains('active');

  try {
    if (isFav) {
      await api.delete(`/me/favourites/${businessData.id}`);
      btn.classList.remove('active');
      btn.querySelector('svg').setAttribute('fill', 'none');
      showToast('Removed from saved places', 'info');
    } else {
      await api.post(`/me/favourites/${businessData.id}`);
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
      showToast('Saved to your favourites!', 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Share Business URL
 */
function shareBusiness() {
  if (navigator.share) {
    navigator
      .share({
        title: businessData ? businessData.name : 'Locafy Business',
        text: `Check out ${businessData.name} on Locafy!`,
        url: window.location.href
      })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('Listing link copied to clipboard!', 'success');
  }
}

/**
 * Submit Enquiry Message
 */
async function submitEnquiry(e) {
  e.preventDefault();
  const name = document.getElementById('enqName').value.trim();
  const phone = document.getElementById('enqPhone').value.trim();
  const email = document.getElementById('enqEmail').value.trim();
  const body = document.getElementById('enqBody').value.trim();
  const btn = document.getElementById('enqSubmitBtn');

  btn.disabled = true;
  btn.textContent = 'Sending message…';

  try {
    await api.post(`/businesses/${businessData.id}/message`, {
      name,
      phone,
      email,
      body
    });

    showToast('Your message has been sent to the owner!', 'success');
    document.getElementById('enquiryForm').reset();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Enquiry';
  }
}

/**
 * Submit Review
 */
async function submitReview(e) {
  e.preventDefault();
  const user = api.getUser();
  if (!user) {
    showToast('Please log in to submit a review', 'info');
    setTimeout(() => {
      window.location.href = `auth-user.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 800);
    return;
  }

  const rating = parseInt(document.getElementById('reviewRatingSelect').value, 10);
  const comment = document.getElementById('reviewComment').value.trim();
  const btn = document.getElementById('reviewSubmitBtn');

  btn.disabled = true;
  btn.textContent = 'Submitting…';

  try {
    await api.post(`/businesses/${businessData.id}/reviews`, { rating, comment });
    showToast('Review submitted successfully! Thank you.', 'success');
    document.getElementById('reviewForm').reset();
    // Refresh business details to update rating
    loadBusinessDetails(businessData.id);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post Review';
  }
}

function openGalleryModal(imgSrc) {
  const modal = document.getElementById('galleryModal');
  const modalImg = document.getElementById('modalImage');
  if (modal && modalImg) {
    modalImg.src = imgSrc;
    modal.classList.add('show');
  }
}

function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  if (modal) modal.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  initListingPage();
});

window.triggerCall = triggerCall;
window.triggerWhatsApp = triggerWhatsApp;
window.triggerDirections = triggerDirections;
window.toggleListingFav = toggleListingFav;
window.shareBusiness = shareBusiness;
window.submitEnquiry = submitEnquiry;
window.submitReview = submitReview;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
