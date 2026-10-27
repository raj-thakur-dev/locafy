const db = require('../db');
const { formatError } = require('../utils/helpers');

function getCategories(req, res) {
  try {
    const categories = db.prepare(`
      SELECT c.id, c.name, c.slug, c.icon, c.color,
             COUNT(CASE WHEN b.status = 'approved' THEN b.id END) AS business_count
      FROM categories c
      LEFT JOIN businesses b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return res.status(200).json({ categories });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Failed to fetch categories'));
  }
}

module.exports = {
  getCategories
};
