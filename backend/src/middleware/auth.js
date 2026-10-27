const { verifyToken, formatError } = require('../utils/helpers');
const db = require('../db');

/**
 * Middleware to authenticate requests via Bearer token
 * If optional is true, proceeds even if no token is provided.
 */
function authenticateToken(optional = false) {
  return (req, res, next) => {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json(formatError('UNAUTHORIZED', 'Authentication token required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json(formatError('INVALID_TOKEN', 'Session expired or invalid token'));
    }

    // Verify user still exists in database
    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json(formatError('USER_NOT_FOUND', 'User account does not exist'));
    }

    req.user = user;
    next();
  };
}

/**
 * Middleware to restrict access to specific roles (e.g. ['business'], ['admin'])
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatError('UNAUTHORIZED', 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(formatError('FORBIDDEN', `Access forbidden: requires role in [${allowedRoles.join(', ')}]`));
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
