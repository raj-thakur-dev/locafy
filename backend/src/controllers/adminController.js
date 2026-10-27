const db = require('../db');
const { formatError } = require('../utils/helpers');

/**
 * GET /api/admin/businesses
 * List businesses for moderation
 */
function getAdminBusinesses(req, res) {
  try {
    const { status, city, category } = req.query;
    let sql = `
      SELECT b.*, c.name AS category_name, c.slug AS category_slug,
             u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      JOIN users u ON b.owner_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND b.status = ?`;
      params.push(status);
    }
    if (city) {
      sql += ` AND b.city LIKE ?`;
      params.push(`%${city}%`);
    }
    if (category) {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    sql += ` ORDER BY b.created_at DESC`;
    const businesses = db.prepare(sql).all(params);

    return res.status(200).json({ businesses });
  } catch (err) {
    console.error('getAdminBusinesses error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve businesses for admin'));
  }
}

/**
 * PATCH /api/admin/businesses/:id/approve
 */
function approveBusiness(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const result = db.prepare('UPDATE businesses SET status = \'approved\' WHERE id = ?').run(businessId);
    if (result.changes === 0) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }
    return res.status(200).json({ message: 'Business approved successfully', status: 'approved' });
  } catch (err) {
    console.error('approveBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to approve business'));
  }
}

/**
 * PATCH /api/admin/businesses/:id/reject
 */
function rejectBusiness(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const result = db.prepare('UPDATE businesses SET status = \'rejected\' WHERE id = ?').run(businessId);
    if (result.changes === 0) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }
    return res.status(200).json({ message: 'Business rejected', status: 'rejected' });
  } catch (err) {
    console.error('rejectBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to reject business'));
  }
}

/**
 * PATCH /api/admin/businesses/:id/verify
 * Toggle or set verified badge
 */
function toggleVerifyBusiness(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const biz = db.prepare('SELECT is_verified FROM businesses WHERE id = ?').get(businessId);
    if (!biz) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    const newVerified = biz.is_verified === 1 ? 0 : 1;
    db.prepare('UPDATE businesses SET is_verified = ? WHERE id = ?').run(newVerified, businessId);
    return res.status(200).json({
      message: newVerified ? 'Verified badge granted' : 'Verified badge revoked',
      is_verified: newVerified
    });
  } catch (err) {
    console.error('toggleVerifyBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to toggle verification'));
  }
}

/**
 * GET /api/admin/stats
 * Overview numbers for admin dashboard
 */
function getAdminStats(req, res) {
  try {
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const ownersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = \'business\'').get().count;
    const bizTotal = db.prepare('SELECT COUNT(*) as count FROM businesses').get().count;
    const bizApproved = db.prepare('SELECT COUNT(*) as count FROM businesses WHERE status = \'approved\'').get().count;
    const bizPending = db.prepare('SELECT COUNT(*) as count FROM businesses WHERE status = \'pending\'').get().count;
    const bizVerified = db.prepare('SELECT COUNT(*) as count FROM businesses WHERE is_verified = 1').get().count;
    const leadsCount = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const reviewsCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
    const messagesCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;

    return res.status(200).json({
      stats: {
        total_users: usersCount,
        business_owners: ownersCount,
        total_businesses: bizTotal,
        approved_businesses: bizApproved,
        pending_businesses: bizPending,
        verified_businesses: bizVerified,
        total_leads: leadsCount,
        total_reviews: reviewsCount,
        total_messages: messagesCount
      }
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve admin stats'));
  }
}

/**
 * GET /api/admin/users
 * List all users with stats
 */
function getAdminUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             COUNT(b.id) AS businesses_count
      FROM users u
      LEFT JOIN businesses b ON b.owner_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    return res.status(200).json({ users });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve users'));
  }
}

module.exports = {
  getAdminBusinesses,
  approveBusiness,
  rejectBusiness,
  toggleVerifyBusiness,
  getAdminStats,
  getAdminUsers
};
