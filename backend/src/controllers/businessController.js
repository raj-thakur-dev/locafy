const db = require('../db');
const { calculateDistanceKm, isOpenNow, formatError } = require('../utils/helpers');

/**
 * GET /api/businesses
 * Search and filter businesses
 */
function getBusinesses(req, res) {
  try {
    const {
      q,
      category,
      city,
      lat,
      lng,
      radius_km,
      open_now,
      min_rating,
      verified,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const userLat = lat != null && lat !== '' ? parseFloat(lat) : null;
    const userLng = lng != null && lng !== '' ? parseFloat(lng) : null;
    const radius = radius_km ? parseFloat(radius_km) : null;

    let baseSql = `
      SELECT b.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      WHERE b.status = 'approved'
    `;
    const params = [];

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      baseSql += ` AND (b.name LIKE ? OR b.description LIKE ? OR b.area LIKE ? OR b.city LIKE ? OR c.name LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    if (category && category.trim()) {
      baseSql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category.trim(), category.trim());
    }

    if (city && city.trim()) {
      baseSql += ` AND b.city LIKE ?`;
      params.push(`%${city.trim()}%`);
    }

    if (min_rating) {
      baseSql += ` AND b.avg_rating >= ?`;
      params.push(parseFloat(min_rating));
    }

    if (verified === 'true' || verified === '1') {
      baseSql += ` AND b.is_verified = 1`;
    }

    let rows = db.prepare(baseSql).all(params);

    // Compute distance and open status for every business
    rows = rows.map((b) => {
      let distance_km = null;
      if (userLat != null && userLng != null) {
        distance_km = calculateDistanceKm(userLat, userLng, b.lat, b.lng);
      }
      const is_open = isOpenNow(b.opening_hours_json);

      let gallery = [];
      try {
        gallery = JSON.parse(b.gallery_json || '[]');
      } catch (e) {
        gallery = [];
      }

      return {
        ...b,
        distance_km,
        is_open,
        gallery
      };
    });

    // Filter by radius if requested
    if (radius != null && userLat != null && userLng != null) {
      rows = rows.filter((b) => b.distance_km != null && b.distance_km <= radius);
    }

    // Filter by open_now if requested
    if (open_now === 'true' || open_now === '1') {
      rows = rows.filter((b) => b.is_open === true);
    }

    // Sort results
    if (sort === 'distance' && userLat != null && userLng != null) {
      rows.sort((a, b) => (a.distance_km || 999999) - (b.distance_km || 999999));
    } else if (sort === 'rating') {
      rows.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);
    } else if (sort === 'newest') {
      rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      // Default: distance if coordinates provided, else rating
      if (userLat != null && userLng != null) {
        rows.sort((a, b) => (a.distance_km || 999999) - (b.distance_km || 999999));
      } else {
        rows.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);
      }
    }

    const total = rows.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;
    const paginated = rows.slice(offset, offset + limitNum);

    return res.status(200).json({
      businesses: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
  } catch (err) {
    console.error('getBusinesses error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve businesses'));
  }
}

/**
 * GET /api/businesses/trending
 * Top businesses by recent leads + rating near user
 */
function getTrending(req, res) {
  try {
    const { lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : 28.6139; // Default Delhi
    const userLng = lng ? parseFloat(lng) : 77.2090;

    const sql = `
      SELECT b.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon,
             COUNT(l.id) AS recent_leads
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN leads l ON l.business_id = b.id AND l.created_at >= datetime('now', '-30 days')
      WHERE b.status = 'approved'
      GROUP BY b.id
      ORDER BY recent_leads DESC, b.avg_rating DESC
      LIMIT 20
    `;
    let rows = db.prepare(sql).all();

    rows = rows.map((b) => {
      const distance_km = calculateDistanceKm(userLat, userLng, b.lat, b.lng);
      const is_open = isOpenNow(b.opening_hours_json);
      return {
        ...b,
        distance_km,
        is_open
      };
    });

    // Sort by a composite of distance and rating
    rows.sort((a, b) => {
      const distA = a.distance_km || 10;
      const distB = b.distance_km || 10;
      return (b.avg_rating * 2 - distA * 0.2) - (a.avg_rating * 2 - distB * 0.2);
    });

    return res.status(200).json({ businesses: rows.slice(0, 8) });
  } catch (err) {
    console.error('getTrending error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to fetch trending businesses'));
  }
}

/**
 * GET /api/businesses/top-by-category
 * Feeds the "Top picks" carousel tabs
 */
function getTopByCategory(req, res) {
  try {
    const { category, lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : 28.6139;
    const userLng = lng ? parseFloat(lng) : 77.2090;

    let sql = `
      SELECT b.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      WHERE b.status = 'approved'
    `;
    const params = [];

    if (category && category.trim()) {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category.trim(), category.trim());
    }

    sql += ` ORDER BY b.avg_rating DESC, b.review_count DESC LIMIT 15`;

    let rows = db.prepare(sql).all(params);
    rows = rows.map((b) => ({
      ...b,
      distance_km: calculateDistanceKm(userLat, userLng, b.lat, b.lng),
      is_open: isOpenNow(b.opening_hours_json)
    }));

    return res.status(200).json({ businesses: rows });
  } catch (err) {
    console.error('getTopByCategory error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to fetch top businesses by category'));
  }
}

/**
 * GET /api/businesses/:id
 * Full details + reviews summary + logs a 'view' lead
 */
function getBusinessById(req, res) {
  try {
    const { id } = req.params;
    const businessId = parseInt(id, 10);
    if (!businessId) {
      return res.status(400).json(formatError('INVALID_ID', 'Invalid business ID'));
    }

    const business = db.prepare(`
      SELECT b.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon,
             u.name AS owner_name, u.email AS owner_email
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?
    `).get(businessId);

    if (!business) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    // Log a 'view' lead silently (authenticated user if available, else null)
    const userId = req.user ? req.user.id : null;
    try {
      db.prepare(`INSERT INTO leads (business_id, user_id, type) VALUES (?, ?, 'view')`).run(businessId, userId);
    } catch (e) {
      // Non-blocking
    }

    // Parse JSON fields
    let gallery = [];
    try {
      gallery = JSON.parse(business.gallery_json || '[]');
    } catch (e) {
      gallery = [];
    }

    let opening_hours = {};
    try {
      opening_hours = JSON.parse(business.opening_hours_json || '{}');
    } catch (e) {
      opening_hours = {};
    }

    const is_open = isOpenNow(opening_hours);

    // Fetch latest 5 reviews
    const recentReviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.business_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all(businessId);

    // Rating breakdown (count of 5-star, 4-star, etc.)
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const counts = db.prepare(`
      SELECT rating, COUNT(*) AS count
      FROM reviews
      WHERE business_id = ?
      GROUP BY rating
    `).all(businessId);
    for (const row of counts) {
      ratingBreakdown[row.rating] = row.count;
    }

    // Check if user has favourited this business
    let is_favourited = false;
    if (userId) {
      const fav = db.prepare('SELECT 1 FROM favourites WHERE user_id = ? AND business_id = ?').get(userId, businessId);
      is_favourited = Boolean(fav);
    }

    return res.status(200).json({
      business: {
        ...business,
        is_open,
        gallery,
        opening_hours,
        is_favourited,
        recent_reviews: recentReviews,
        rating_breakdown: ratingBreakdown
      }
    });
  } catch (err) {
    console.error('getBusinessById error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve business details'));
  }
}

/**
 * GET /api/businesses/:id/reviews
 * Paginated reviews for a business
 */
function getBusinessReviews(req, res) {
  try {
    const { id } = req.params;
    const businessId = parseInt(id, 10);
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const total = db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE business_id = ?').get(businessId).count;
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name, u.id AS user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.business_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(businessId, limitNum, offset);

    return res.status(200).json({
      reviews,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (err) {
    console.error('getBusinessReviews error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to fetch reviews'));
  }
}

/**
 * POST /api/businesses/:id/reviews
 * Submit a review (authenticated user only)
 */
function createReview(req, res) {
  try {
    const { id } = req.params;
    const businessId = parseInt(id, 10);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const biz = db.prepare('SELECT id FROM businesses WHERE id = ?').get(businessId);
    if (!biz) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    // Check if user already reviewed
    const existing = db.prepare('SELECT id FROM reviews WHERE business_id = ? AND user_id = ?').get(businessId, userId);
    if (existing) {
      return res.status(409).json(formatError('ALREADY_REVIEWED', 'You have already reviewed this business'));
    }

    db.prepare(`
      INSERT INTO reviews (business_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(businessId, userId, rating, comment ? comment.trim() : null);

    // Recalculate average rating & review count for the business
    const stats = db.prepare(`
      SELECT COUNT(*) AS total, AVG(rating) AS avg
      FROM reviews
      WHERE business_id = ?
    `).get(businessId);

    const newAvg = stats.total > 0 ? Math.round(stats.avg * 10) / 10 : 0;
    db.prepare(`
      UPDATE businesses
      SET avg_rating = ?, review_count = ?
      WHERE id = ?
    `).run(newAvg, stats.total, businessId);

    return res.status(201).json({
      message: 'Review submitted successfully',
      avg_rating: newAvg,
      review_count: stats.total
    });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to submit review'));
  }
}

/**
 * POST /api/businesses/:id/track
 * Log a lead interaction: call, whatsapp, directions
 */
function trackLead(req, res) {
  try {
    const { id } = req.params;
    const businessId = parseInt(id, 10);
    const { type } = req.body;
    const userId = req.user ? req.user.id : null;

    const biz = db.prepare('SELECT id FROM businesses WHERE id = ?').get(businessId);
    if (!biz) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    db.prepare(`
      INSERT INTO leads (business_id, user_id, type)
      VALUES (?, ?, ?)
    `).run(businessId, userId, type);

    return res.status(200).json({ success: true, message: 'Interaction tracked' });
  } catch (err) {
    console.error('trackLead error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to track lead'));
  }
}

/**
 * POST /api/businesses/:id/message
 * Send an enquiry message to business owner
 */
function sendMessage(req, res) {
  try {
    const { id } = req.params;
    const businessId = parseInt(id, 10);
    const { name, phone, email, body } = req.body;
    const userId = req.user ? req.user.id : null;

    const biz = db.prepare('SELECT id, name FROM businesses WHERE id = ?').get(businessId);
    if (!biz) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    // Save message
    const result = db.prepare(`
      INSERT INTO messages (business_id, user_id, name, phone, email, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(businessId, userId, name.trim(), phone.trim(), email ? email.trim() : null, body.trim());

    // Also track as a 'message' lead
    db.prepare(`
      INSERT INTO leads (business_id, user_id, type)
      VALUES (?, ?, 'message')
    `).run(businessId, userId);

    return res.status(201).json({
      message: 'Enquiry sent successfully to the business owner',
      message_id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to send enquiry'));
  }
}

module.exports = {
  getBusinesses,
  getTrending,
  getTopByCategory,
  getBusinessById,
  getBusinessReviews,
  createReview,
  trackLead,
  sendMessage
};
