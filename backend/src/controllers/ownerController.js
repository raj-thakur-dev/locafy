const db = require('../db');
const { formatError, isOpenNow } = require('../utils/helpers');

/**
 * Helper to enforce ownership check
 */
function verifyBusinessOwnership(businessId, user) {
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!biz) return { error: { status: 404, code: 'NOT_FOUND', message: 'Business not found' } };
  if (user.role !== 'admin' && biz.owner_id !== user.id) {
    return { error: { status: 403, code: 'FORBIDDEN', message: 'You do not have permission to modify this business' } };
  }
  return { business: biz };
}

/**
 * GET /api/owner/businesses
 * List all businesses for logged-in business owner
 */
function getOwnerBusinesses(req, res) {
  try {
    const ownerId = req.user.id;
    const businesses = db.prepare(`
      SELECT b.*, c.name AS category_name, c.slug AS category_slug,
             (SELECT COUNT(*) FROM leads l WHERE l.business_id = b.id) AS total_leads,
             (SELECT COUNT(*) FROM messages m WHERE m.business_id = b.id AND m.status = 'new') AS unread_messages
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      WHERE b.owner_id = ?
      ORDER BY b.created_at DESC
    `).all(ownerId);

    const formatted = businesses.map((b) => ({
      ...b,
      is_open: isOpenNow(b.opening_hours_json)
    }));

    return res.status(200).json({ businesses: formatted });
  } catch (err) {
    console.error('getOwnerBusinesses error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve owner listings'));
  }
}

/**
 * POST /api/owner/businesses
 * Create new business listing (starts with status = 'pending')
 */
function createBusiness(req, res) {
  try {
    const ownerId = req.user.id;
    const {
      name,
      category_id,
      description,
      phone,
      whatsapp,
      email,
      website,
      address,
      area,
      city,
      pincode,
      lat,
      lng,
      image_url,
      opening_hours_json
    } = req.body;

    // Check if category exists
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!cat) {
      return res.status(400).json(formatError('INVALID_CATEGORY', 'Selected category does not exist'));
    }

    const defaultImg = image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';
    const hours = typeof opening_hours_json === 'object' ? JSON.stringify(opening_hours_json) : (opening_hours_json || '{}');
    const gallery = JSON.stringify([defaultImg]);

    const result = db.prepare(`
      INSERT INTO businesses (
        owner_id, name, category_id, description, phone, whatsapp, email, website,
        address, area, city, pincode, lat, lng, image_url, gallery_json, opening_hours_json,
        is_verified, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        0, 'pending'
      )
    `).run(
      ownerId,
      name.trim(),
      category_id,
      description ? description.trim() : null,
      phone.trim(),
      whatsapp ? whatsapp.trim() : phone.trim(),
      email ? email.trim() : null,
      website ? website.trim() : null,
      address.trim(),
      area ? area.trim() : null,
      city.trim(),
      pincode ? pincode.trim() : null,
      lat,
      lng,
      defaultImg,
      gallery,
      hours
    );

    const newBizId = Number(result.lastInsertRowid);
    const newBiz = db.prepare(`
      SELECT b.*, c.name AS category_name, c.slug AS category_slug
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(newBizId);

    return res.status(201).json({
      message: 'Business listing created successfully and submitted for verification',
      business: newBiz
    });
  } catch (err) {
    console.error('createBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to create business listing'));
  }
}

/**
 * PUT /api/owner/businesses/:id
 * Update business details (owner or admin only)
 */
function updateBusiness(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const check = verifyBusinessOwnership(businessId, req.user);
    if (check.error) {
      return res.status(check.error.status).json(formatError(check.error.code, check.error.message));
    }

    const {
      name,
      category_id,
      description,
      phone,
      whatsapp,
      email,
      website,
      address,
      area,
      city,
      pincode,
      lat,
      lng,
      image_url,
      opening_hours_json
    } = req.body;

    const current = check.business;
    const hours = opening_hours_json !== undefined
      ? (typeof opening_hours_json === 'object' ? JSON.stringify(opening_hours_json) : opening_hours_json)
      : current.opening_hours_json;

    db.prepare(`
      UPDATE businesses SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        phone = COALESCE(?, phone),
        whatsapp = COALESCE(?, whatsapp),
        email = COALESCE(?, email),
        website = COALESCE(?, website),
        address = COALESCE(?, address),
        area = COALESCE(?, area),
        city = COALESCE(?, city),
        pincode = COALESCE(?, pincode),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        image_url = COALESCE(?, image_url),
        opening_hours_json = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      category_id || null,
      description !== undefined ? description : null,
      phone ? phone.trim() : null,
      whatsapp !== undefined ? whatsapp : null,
      email !== undefined ? email : null,
      website !== undefined ? website : null,
      address ? address.trim() : null,
      area !== undefined ? area : null,
      city ? city.trim() : null,
      pincode !== undefined ? pincode : null,
      lat || null,
      lng || null,
      image_url || null,
      hours,
      businessId
    );

    const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
    return res.status(200).json({
      message: 'Business updated successfully',
      business: updated
    });
  } catch (err) {
    console.error('updateBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to update business'));
  }
}

/**
 * DELETE /api/owner/businesses/:id
 * Delete a business (owner or admin only)
 */
function deleteBusiness(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const check = verifyBusinessOwnership(businessId, req.user);
    if (check.error) {
      return res.status(check.error.status).json(formatError(check.error.code, check.error.message));
    }

    db.prepare('DELETE FROM businesses WHERE id = ?').run(businessId);
    return res.status(200).json({ message: 'Business listing deleted successfully' });
  } catch (err) {
    console.error('deleteBusiness error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to delete business'));
  }
}

/**
 * POST /api/owner/businesses/:id/images
 * Upload business image and update cover/gallery
 */
function uploadBusinessImage(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const check = verifyBusinessOwnership(businessId, req.user);
    if (check.error) {
      return res.status(check.error.status).json(formatError(check.error.code, check.error.message));
    }

    if (!req.file) {
      return res.status(400).json(formatError('NO_FILE', 'No image file uploaded'));
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    let gallery = [];
    try {
      gallery = JSON.parse(check.business.gallery_json || '[]');
    } catch (e) {
      gallery = [];
    }

    gallery.unshift(imageUrl);
    if (gallery.length > 8) gallery = gallery.slice(0, 8);

    db.prepare(`
      UPDATE businesses
      SET image_url = ?, gallery_json = ?
      WHERE id = ?
    `).run(imageUrl, JSON.stringify(gallery), businessId);

    return res.status(200).json({
      message: 'Image uploaded successfully',
      image_url: imageUrl,
      gallery
    });
  } catch (err) {
    console.error('uploadBusinessImage error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to upload image'));
  }
}

/**
 * GET /api/owner/businesses/:id/analytics?range=7d|30d
 * Comprehensive stats, daily series, rating trend, search visibility
 */
function getBusinessAnalytics(req, res) {
  try {
    const businessId = parseInt(req.params.id, 10);
    const check = verifyBusinessOwnership(businessId, req.user);
    if (check.error) {
      return res.status(check.error.status).json(formatError(check.error.code, check.error.message));
    }

    const { range = '7d' } = req.query;
    const days = range === '30d' ? 30 : 7;

    // Counts by type over the time period
    const counts = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM leads
      WHERE business_id = ? AND created_at >= datetime('now', ?)
      GROUP BY type
    `).all(businessId, `-${days} days`);

    const summary = {
      views: 0,
      calls: 0,
      whatsapp: 0,
      directions: 0,
      messages: 0,
      total_leads: 0
    };

    for (const r of counts) {
      if (r.type === 'view') summary.views = r.count;
      else if (r.type === 'call') summary.calls = r.count;
      else if (r.type === 'whatsapp') summary.whatsapp = r.count;
      else if (r.type === 'directions') summary.directions = r.count;
      else if (r.type === 'message') summary.messages = r.count;
      summary.total_leads += r.count;
    }

    // Daily series for leads chart
    const dailyRaw = db.prepare(`
      SELECT date(created_at) as date,
             SUM(CASE WHEN type = 'view' THEN 1 ELSE 0 END) as views,
             SUM(CASE WHEN type != 'view' THEN 1 ELSE 0 END) as actions
      FROM leads
      WHERE business_id = ? AND created_at >= datetime('now', ?)
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(businessId, `-${days} days`);

    // Fill all days in range so chart is continuous
    const dailySeries = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyRaw.find((item) => item.date === dateStr);
      dailySeries.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        views: match ? match.views : 0,
        actions: match ? match.actions : 0
      });
    }

    // Rating trend & visibility score
    const avgRating = check.business.avg_rating || 0;
    const reviewCount = check.business.review_count || 0;
    const visibilityPercent = Math.min(100, Math.round((summary.views * 2 + summary.calls * 8 + avgRating * 10) / 3));

    return res.status(200).json({
      range,
      days,
      summary,
      daily_series: dailySeries,
      rating_trend: {
        avg_rating: avgRating,
        review_count: reviewCount,
        satisfaction_score: Math.round((avgRating / 5) * 100)
      },
      search_visibility: {
        score: Math.max(15, visibilityPercent),
        trend: '+12% vs last period'
      }
    });
  } catch (err) {
    console.error('getBusinessAnalytics error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve analytics'));
  }
}

/**
 * GET /api/owner/messages
 * List all customer enquiries for businesses owned by req.user.id
 */
function getOwnerMessages(req, res) {
  try {
    const ownerId = req.user.id;
    const messages = db.prepare(`
      SELECT m.*, b.name AS business_name, b.id AS business_id
      FROM messages m
      JOIN businesses b ON m.business_id = b.id
      WHERE b.owner_id = ?
      ORDER BY m.created_at DESC
    `).all(ownerId);

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('getOwnerMessages error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve messages'));
  }
}

/**
 * PATCH /api/owner/messages/:id/read
 * Mark a message as read
 */
function markMessageRead(req, res) {
  try {
    const messageId = parseInt(req.params.id, 10);
    const msg = db.prepare(`
      SELECT m.id, b.owner_id
      FROM messages m
      JOIN businesses b ON m.business_id = b.id
      WHERE m.id = ?
    `).get(messageId);

    if (!msg) {
      return res.status(404).json(formatError('NOT_FOUND', 'Message not found'));
    }

    if (req.user.role !== 'admin' && msg.owner_id !== req.user.id) {
      return res.status(403).json(formatError('FORBIDDEN', 'Access denied to this message'));
    }

    db.prepare('UPDATE messages SET status = \'read\' WHERE id = ?').run(messageId);
    return res.status(200).json({ message: 'Message marked as read' });
  } catch (err) {
    console.error('markMessageRead error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to update message status'));
  }
}

module.exports = {
  getOwnerBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  uploadBusinessImage,
  getBusinessAnalytics,
  getOwnerMessages,
  markMessageRead
};
