/**
 * Locafy — Homepage Controller
 */

let currentSlide = 0;
let slideInterval = null;
const totalSlides = 4;
let userCoords = { lat: 28.6139, lng: 77.2090, city: 'New Delhi' }; // Delhi default

function hbGoTo(index) {
  currentSlide = (index + totalSlides) % totalSlides;
  const slides = document.querySelectorAll('.hb-slide');
  const dots = document.querySelectorAll('.hb-dot');

  slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function startHeroSlider() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    hbGoTo(currentSlide + 1);
  }, 5000);

  const heroSec = document.getElementById('hero');
  if (heroSec) {
    heroSec.addEventListener('mouseenter', () => clearInterval(slideInterval));
    heroSec.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => hbGoTo(currentSlide + 1), 5000);
    });
  }
}

function scrollSpot(dir) {
  const track = document.getElementById('spotTrack');
  if (track) {
    track.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }
}

/**
 * Geolocation detection
 */
function initGeolocation() {
  const geoBtn = document.getElementById('heroGeoBtn');
  const locInput = document.getElementById('heroLocInput');

  function locateUser() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'info');
      return;
    }

    if (geoBtn) geoBtn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords.lat = Number(pos.coords.latitude.toFixed(4));
        userCoords.lng = Number(pos.coords.longitude.toFixed(4));
        if (locInput) locInput.value = `${userCoords.lat}, ${userCoords.lng}`;
        if (geoBtn) geoBtn.classList.remove('loading');
        showToast('Location updated', 'success');
        updateTrendingCoords();
        loadTrending();
      },
      (err) => {
        if (geoBtn) geoBtn.classList.remove('loading');
        console.warn('Geolocation error:', err.message);
        // Fallback to Delhi
        userCoords = { lat: 28.6139, lng: 77.2090, city: 'New Delhi' };
        if (locInput) locInput.value = 'Delhi, NCR';
        updateTrendingCoords();
      },
      { timeout: 8000 }
    );
  }

  if (geoBtn) {
    geoBtn.addEventListener('click', locateUser);
  }

  // Initial attempt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords.lat = Number(pos.coords.latitude.toFixed(4));
        userCoords.lng = Number(pos.coords.longitude.toFixed(4));
        updateTrendingCoords();
        loadTrending();
      },
      () => {
        updateTrendingCoords();
        loadTrending();
      },
      { timeout: 4000 }
    );
  } else {
    loadTrending();
  }
}

function updateTrendingCoords() {
  const trendEyebrow = document.getElementById('trendEyebrow');
  if (trendEyebrow) {
    trendEyebrow.textContent = `${userCoords.lat}° N, ${userCoords.lng}° E · NEAR YOU`;
  }
}

/**
 * Autocomplete for hero search
 */
function initAutocomplete() {
  const whatInput = document.getElementById('heroWhatInput');
  const locInput = document.getElementById('heroLocInput');
  const dropdown = document.getElementById('heroAutocomplete');
  let debounceTimer = null;

  if (whatInput) {
    whatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitHeroSearch();
      }
    });

    whatInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = whatInput.value.trim();
      if (query.length < 2) {
        if (dropdown) {
          dropdown.style.display = 'none';
          dropdown.innerHTML = '';
        }
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const data = await api.get('/businesses', { q: query, limit: 6 });
          if (dropdown && data.businesses && data.businesses.length > 0) {
            dropdown.innerHTML = data.businesses
              .map(
                (b) => `
              <div class="autocomplete-item" onclick="selectAutocomplete('${api.escapeHtml(b.name)}', ${b.id})">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop'}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;">
                  <div>
                    <span class="ai-name">${api.escapeHtml(b.name)}</span>
                    <span style="font-size:12px;color:var(--muted);display:block;">${api.escapeHtml(b.area || b.city)}</span>
                  </div>
                </div>
                <span class="ai-cat">${api.escapeHtml(b.category_name)}</span>
              </div>
            `
              )
              .join('');
            dropdown.style.display = 'block';
          } else if (dropdown) {
            dropdown.style.display = 'none';
          }
        } catch (e) {
          if (dropdown) dropdown.style.display = 'none';
        }
      }, 250);
    });
  }

  if (locInput) {
    locInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitHeroSearch();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (dropdown && !e.target.closest('#heroSearchCard')) {
      dropdown.style.display = 'none';
    }
  });
}

function selectAutocomplete(name, id) {
  window.location.href = `business.html?id=${id}`;
}

/**
 * Submit hero search form
 */
function submitHeroSearch() {
  const whatInput = document.getElementById('heroWhatInput');
  const locInput = document.getElementById('heroLocInput');

  const q = whatInput ? whatInput.value.trim() : '';
  const loc = locInput ? locInput.value.trim() : '';

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (loc && loc !== 'Current Location') {
    params.set('city', loc);
  }
  if (userCoords.lat && userCoords.lng) {
    params.set('lat', userCoords.lat);
    params.set('lng', userCoords.lng);
  }

  window.location.href = `search.html?${params.toString()}`;
}

/**
 * Quick search from tags/chips
 */
function quickSearch(term) {
  const whatInput = document.getElementById('heroWhatInput');
  if (whatInput) whatInput.value = term;
  submitHeroSearch();
}

/**
 * Categories Section Tabs & Grid Filtering
 */
const categoryGroupMap = {
  food: ['restaurants'],
  beauty: ['salons', 'gyms'],
  services: ['home-decor', 'repairs', 'movers'],
  health: ['hospitals', 'healthcare', 'pet-care'],
  property: ['realestate', 'education', 'events']
};

function filterCategoryGrid(group, btn) {
  document.querySelectorAll('.cat-tab').forEach((t) => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const tiles = document.querySelectorAll('#categoryGrid .cat-tile');
  tiles.forEach((tile) => {
    const tileGroup = tile.getAttribute('data-cat-group');
    if (group === 'all' || tileGroup === group) {
      tile.classList.remove('hidden-by-filter');
    } else {
      tile.classList.add('hidden-by-filter');
    }
  });

  loadCategoryPreview(group);
}

async function loadCategoryPreview(group = 'all') {
  const cardsContainer = document.getElementById('catPreviewCards');
  const eyebrowEl = document.getElementById('catPreviewEyebrow');
  const titleEl = document.getElementById('catPreviewTitle');
  const exploreBtn = document.getElementById('catPreviewExploreBtn');

  if (!cardsContainer) return;

  const groupTitles = {
    all: { eyebrow: 'FEATURED PLACES', title: 'Top Rated in All Categories', url: 'search.html' },
    food: { eyebrow: 'FOOD & DINING', title: 'Top Rated Cafes & Restaurants', url: 'search.html?category=restaurants' },
    beauty: { eyebrow: 'BEAUTY & WELLNESS', title: 'Luxury Salons, Spas & Fitness Centers', url: 'search.html?category=salons' },
    services: { eyebrow: 'HOME & SERVICES', title: 'Trusted Repairs, Decor & Relocation', url: 'search.html?category=repairs' },
    health: { eyebrow: 'HEALTHCARE', title: 'Verified Clinics, Hospitals & Specialists', url: 'search.html?category=healthcare' },
    property: { eyebrow: 'REAL ESTATE & MORE', title: 'Commercial Spaces, Flats & Venues', url: 'search.html?category=realestate' }
  };

  const meta = groupTitles[group] || groupTitles.all;
  if (eyebrowEl) eyebrowEl.textContent = meta.eyebrow;
  if (titleEl) titleEl.textContent = meta.title;
  if (exploreBtn) exploreBtn.href = meta.url;

  cardsContainer.innerHTML = `
    <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div></div>
    <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div></div>
    <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div></div>
    <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div></div>
  `;

  try {
    let catSlug = '';
    if (group !== 'all' && categoryGroupMap[group]) {
      catSlug = categoryGroupMap[group][0];
    }

    const data = await api.get('/businesses', {
      category: catSlug,
      sort: 'rating',
      limit: 4,
      lat: userCoords.lat,
      lng: userCoords.lng
    });

    const businesses = data.businesses || [];
    if (businesses.length === 0) {
      cardsContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted);">No businesses found in this category.</p>`;
      return;
    }

    cardsContainer.innerHTML = businesses
      .map(
        (b) => `
      <div class="biz-card is-visible" onclick="window.location.href='business.html?id=${b.id}'" style="cursor:pointer;">
        <div class="biz-img">
          <img class="biz-img-inner" src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop'}" alt="${api.escapeHtml(b.name)}" loading="lazy">
          <span class="biz-badge ${b.is_open ? '' : 'closed'}">
            ${b.is_open ? '<span class="dot-live"></span>Open now' : 'Closed'}
          </span>
        </div>
        <div class="biz-body">
          <div class="biz-cat">${api.escapeHtml(b.category_name)}</div>
          <div class="biz-name">${api.escapeHtml(b.name)}</div>
          <div class="biz-meta">
            <span class="rating">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
              ${b.avg_rating ? b.avg_rating.toFixed(1) : 'New'}
            </span>
            <span>${api.formatDistance(b.distance_km)}</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.warn('Failed to load category preview:', err);
  }
}

/**
 * Top Picks Spotlight Tabs
 */
async function switchSpot(catSlug, btn) {
  document.querySelectorAll('.spot-tab').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const track = document.getElementById('spotTrack');
  if (!track) return;

  track.classList.add('fade');

  try {
    const data = await api.get('/businesses/top-by-category', {
      category: catSlug,
      lat: userCoords.lat,
      lng: userCoords.lng
    });

    if (data.businesses && data.businesses.length > 0) {
      track.innerHTML = data.businesses
        .map(
          (b) => `
        <div class="spot-card is-visible" data-cat="${api.escapeHtml(catSlug)}" onclick="window.location.href='business.html?id=${b.id}'" style="cursor:pointer;">
          <div class="biz-img" style="height:150px;">
            <img class="biz-img-inner" src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop'}" alt="${api.escapeHtml(b.name)}" loading="lazy">
            <span class="biz-badge ${b.is_open ? '' : 'closed'}">
              ${b.is_open ? '<span class="dot-live"></span>Open now' : 'Closed'}
            </span>
          </div>
          <div class="biz-body">
            <div class="biz-cat">${api.escapeHtml(b.category_name)}</div>
            <div class="biz-name">${api.escapeHtml(b.name)}</div>
            <div class="biz-meta">
              <span class="rating">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
                ${b.avg_rating ? b.avg_rating.toFixed(1) : 'New'}
              </span>
              <span>${api.formatDistance(b.distance_km)}</span>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    } else {
      track.querySelectorAll('.spot-card').forEach((c) => {
        c.style.display = c.dataset.cat === catSlug ? 'block' : 'none';
      });
    }
  } catch (err) {
    track.querySelectorAll('.spot-card').forEach((c) => {
      c.style.display = c.dataset.cat === catSlug ? 'block' : 'none';
    });
  } finally {
    track.scrollLeft = 0;
    track.classList.remove('fade');
  }
}

/**
 * Trending businesses near you
 */
async function loadTrending() {
  const row = document.querySelector('.trend-row');
  if (!row) return;

  try {
    const data = await api.get('/businesses/trending', {
      lat: userCoords.lat,
      lng: userCoords.lng
    });

    if (data.businesses && data.businesses.length > 0) {
      row.innerHTML = data.businesses
        .slice(0, 4)
        .map(
          (b) => `
        <div class="biz-card is-visible" onclick="window.location.href='business.html?id=${b.id}'" style="cursor:pointer;">
          <div class="biz-img">
            <img class="biz-img-inner" src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop'}" alt="${api.escapeHtml(b.name)}" loading="lazy">
            <span class="biz-badge ${b.is_open ? '' : 'closed'}">
              ${b.is_open ? '<span class="dot-live"></span>Open now' : 'Closed'}
            </span>
          </div>
          <div class="biz-body">
            <div class="biz-cat">${api.escapeHtml(b.category_name)}</div>
            <div class="biz-name">${api.escapeHtml(b.name)}</div>
            <div class="biz-meta">
              <span class="rating">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
                ${b.avg_rating ? b.avg_rating.toFixed(1) : 'New'}
              </span>
              <span>${api.formatDistance(b.distance_km)}</span>
            </div>
          </div>
        </div>
      `
        )
        .join('');
    }
  } catch (err) {
    console.warn('Failed to load trending businesses:', err);
  }
}

/**
 * Real numbers for dashboard mock
 */
async function loadDashboardMockStats() {
  const viewsEl = document.querySelector('.dash-stat b[data-target="1284"]');
  const callsEl = document.querySelector('.dash-stat b[data-target="96"]');

  try {
    const data = await api.get('/owner/businesses/1/analytics', { range: '7d' }).catch(() => null);
    if (data && data.summary) {
      if (viewsEl) viewsEl.setAttribute('data-target', data.summary.views || 420);
      if (callsEl) callsEl.setAttribute('data-target', data.summary.calls || 38);
    }
  } catch (e) {
    // Keep fallback defaults
  }
}

document.addEventListener('DOMContentLoaded', () => {
  startHeroSlider();
  initGeolocation();
  initAutocomplete();
  loadCategoryPreview('all');
  const activeSpot = document.querySelector('.spot-tab.active');
  switchSpot('restaurants', activeSpot);
  loadDashboardMockStats();
});

window.hbGoTo = hbGoTo;
window.scrollSpot = scrollSpot;
window.switchSpot = switchSpot;
window.submitHeroSearch = submitHeroSearch;
window.quickSearch = quickSearch;
window.selectAutocomplete = selectAutocomplete;
window.filterCategoryGrid = filterCategoryGrid;
window.loadCategoryPreview = loadCategoryPreview;


/**
 * City navigation helper
 */
function exploreCity(cityName) {
  const locInput = document.getElementById('heroLocInput');
  if (locInput) locInput.value = cityName;
  const params = new URLSearchParams();
  params.set('city', cityName);
  window.location.href = 'search.html?' + params.toString();
}

window.exploreCity = exploreCity;
