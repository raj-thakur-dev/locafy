/**
 * Authentication & Dynamic Navbar Management
 */

const auth = {
  initNavbar() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const user = api.getUser();
    const token = api.getToken();

    if (!user || !token) {
      navActions.innerHTML = `
        <a href="auth-business.html" class="btn btn-ghost">List your business</a>
        <a href="auth-user.html" class="btn btn-primary">Log in</a>
      `;
      return;
    }

    const initial = (user.name || 'User').charAt(0).toUpperCase();
    const isOwner = user.role === 'business' || user.role === 'admin';
    const isAdmin = user.role === 'admin';

    navActions.innerHTML = `
      <div class="user-menu-wrap">
        <button class="user-menu-btn" id="userMenuBtn" aria-label="Account menu">
          <div class="user-avatar-circle">${api.escapeHtml(initial)}</div>
          <span class="user-name-label">${api.escapeHtml(user.name)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <b>${api.escapeHtml(user.name)}</b>
            <span>${api.escapeHtml(user.role)}</span>
          </div>
          ${isOwner ? '<a href="dashboard.html"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Dashboard</a>' : ''}
          ${isAdmin ? '<a href="admin.html"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Admin Portal</a>' : ''}
          <a href="favourites.html"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Saved Favourites</a>
          <button type="button" class="danger-item" onclick="auth.logout()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Log out</button>
        </div>
      </div>
    `;

    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-wrap')) {
          dropdown.classList.remove('show');
        }
      });
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignored
    }
    api.setToken(null);
    api.setUser(null);
    showToast('You have been logged out', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  },

  requireAuth(requiredRole = null) {
    const user = api.getUser();
    const token = api.getToken();

    if (!user || !token) {
      showToast('Please log in to continue', 'info');
      window.location.href = `auth-user.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return false;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      showToast('Access restricted for your account type', 'error');
      window.location.href = 'index.html';
      return false;
    }

    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  auth.initNavbar();
});

window.auth = auth;
