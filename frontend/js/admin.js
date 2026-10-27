/**
 * Locafy — Admin Portal Controller
 */

let adminStats = null;

async function initAdmin() {
  if (!auth.requireAuth('admin')) return;

  await loadAdminStats();
  await loadBusinessesForModeration('all');
  await loadRegisteredUsers();
}

async function loadAdminStats() {
  try {
    const data = await api.get('/admin/stats');
    adminStats = data.stats;

    document.getElementById('statTotalUsers').textContent = adminStats.total_users || 0;
    document.getElementById('statTotalBiz').textContent = adminStats.total_businesses || 0;
    document.getElementById('statPendingBiz').textContent = adminStats.pending_businesses || 0;
    document.getElementById('statVerifiedBiz').textContent = adminStats.verified_businesses || 0;
    document.getElementById('statTotalLeads').textContent = adminStats.total_leads || 0;
    document.getElementById('statTotalReviews').textContent = adminStats.total_reviews || 0;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadBusinessesForModeration(status = 'pending') {
  const tableBody = document.getElementById('adminBizTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Loading businesses…</td></tr>`;

  try {
    const data = await api.get('/admin/businesses', { status });
    const businesses = data.businesses || [];

    if (businesses.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted);">No businesses matching status '${status}'.</td></tr>`;
      return;
    }

    tableBody.innerHTML = businesses
      .map(
        (b) => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${b.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=80&fit=crop'}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">
            <div>
              <b style="color:var(--ink);display:block;">${api.escapeHtml(b.name)}</b>
              <span style="font-size:11px;color:var(--muted);">${api.escapeHtml(b.city)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="biz-cat" style="font-size:10px;">${api.escapeHtml(b.category_name)}</span>
        </td>
        <td>
          <div style="font-size:13px;color:var(--ink);">${api.escapeHtml(b.owner_name)}</div>
          <div style="font-size:11px;color:var(--muted);">${api.escapeHtml(b.owner_email)}</div>
        </td>
        <td>
          <span class="badge-status ${b.status}">${api.escapeHtml(b.status)}</span>
        </td>
        <td>
          <button type="button" class="btn btn-sm ${b.is_verified ? 'btn-primary' : 'btn-ghost'}" style="padding:4px 8px;font-size:11px;" onclick="toggleVerify(${b.id})">
            ${b.is_verified ? '✓ Verified' : '+ Verify'}
          </button>
        </td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted);">
          ${api.formatDate(b.created_at)}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            ${
              b.status !== 'approved'
                ? `<button class="btn btn-sm btn-primary" style="padding:4px 8px;font-size:11px;background:var(--green-dark);" onclick="approveBiz(${b.id})">Approve</button>`
                : ''
            }
            ${
              b.status !== 'rejected'
                ? `<button class="btn btn-sm btn-ghost" style="padding:4px 8px;font-size:11px;color:var(--red);border-color:var(--red);" onclick="rejectBiz(${b.id})">Reject</button>`
                : ''
            }
            <a href="business.html?id=${b.id}" target="_blank" class="btn btn-sm btn-ghost" style="padding:4px 8px;font-size:11px;">View</a>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red);">Error loading businesses: ${api.escapeHtml(err.message)}</td></tr>`;
  }
}

async function approveBiz(id) {
  try {
    await api.patch(`/admin/businesses/${id}/approve`);
    showToast('Business approved successfully!', 'success');
    await loadAdminStats();
    await loadBusinessesForModeration(document.getElementById('statusFilterSelect').value);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectBiz(id) {
  try {
    await api.patch(`/admin/businesses/${id}/reject`);
    showToast('Business rejected', 'info');
    await loadAdminStats();
    await loadBusinessesForModeration(document.getElementById('statusFilterSelect').value);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleVerify(id) {
  try {
    const res = await api.patch(`/admin/businesses/${id}/verify`);
    showToast(res.message, 'success');
    await loadAdminStats();
    await loadBusinessesForModeration(document.getElementById('statusFilterSelect').value);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadRegisteredUsers() {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;

  try {
    const data = await api.get('/admin/users');
    const users = data.users || [];

    tableBody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td><b>${api.escapeHtml(u.name)}</b></td>
        <td>${api.escapeHtml(u.email)}</td>
        <td>${api.escapeHtml(u.phone || '—')}</td>
        <td>
          <span class="badge-status ${u.role === 'admin' ? 'approved' : u.role === 'business' ? 'pending' : ''}">
            ${api.escapeHtml(u.role)}
          </span>
        </td>
        <td>${u.businesses_count || 0} listing(s)</td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted);">${api.formatDate(u.created_at)}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.warn('Failed to load users:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

window.loadBusinessesForModeration = loadBusinessesForModeration;
window.approveBiz = approveBiz;
window.rejectBiz = rejectBiz;
window.toggleVerify = toggleVerify;
