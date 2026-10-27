const db = require('../db');
const { formatError, isOpenNow } = require('../utils/helpers');

/**
 * GET /api/me/favourites
 * List of businesses saved by current user
 */
function getFavourites(req, res) {
  try {
    const userId = req.user.id;
    const favourites = db.prepare(`
      SELECT b.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon,
             f.created_at AS favourited_at
      FROM favourites f
      JOIN businesses b ON f.business_id = b.id
      JOIN categories c ON b.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);

    const formatted = favourites.map((b) => ({
      ...b,
      is_open: isOpenNow(b.opening_hours_json),
      is_favourited: true
    }));

    return res.status(200).json({ favourites: formatted });
  } catch (err) {
    console.error('getFavourites error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to retrieve favourites'));
  }
}

/**
 * POST /api/me/favourites/:businessId
 * Add business to user favourites
 */
function addFavourite(req, res) {
  try {
    const userId = req.user.id;
    const businessId = parseInt(req.params.businessId, 10);

    const biz = db.prepare('SELECT id FROM businesses WHERE id = ?').get(businessId);
    if (!biz) {
      return res.status(404).json(formatError('NOT_FOUND', 'Business not found'));
    }

    db.prepare(`
      INSERT OR IGNORE INTO favourites (user_id, business_id)
      VALUES (?, ?)
    `).run(userId, businessId);

    return res.status(200).json({ message: 'Added to favourites', is_favourited: true });
  } catch (err) {
    console.error('addFavourite error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to save favourite'));
  }
}

/**
 * DELETE /api/me/favourites/:businessId
 * Remove business from user favourites
 */
function removeFavourite(req, res) {
  try {
    const userId = req.user.id;
    const businessId = parseInt(req.params.businessId, 10);

    db.prepare('DELETE FROM favourites WHERE user_id = ? AND business_id = ?').run(userId, businessId);
    return res.status(200).json({ message: 'Removed from favourites', is_favourited: false });
  } catch (err) {
    console.error('removeFavourite error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to remove favourite'));
  }
}

module.exports = {
  getFavourites,
  addFavourite,
  removeFavourite
};
