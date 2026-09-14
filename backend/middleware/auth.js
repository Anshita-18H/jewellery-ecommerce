/**
 * Authentication and Authorization Middleware for AURA — Fine Jewellery
 * Enforces session-based authentication and role-based access control.
 */

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const userRole = req.session.role || req.session.userRole;
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireAuth,
};

