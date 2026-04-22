const { verifyToken } = require('../utils/jwt');

/**
 * Attach req.user from Bearer token — any valid role
 */
function auth(req, res, next) {
  const raw   = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}

/** Admin only */
function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

/** Mechanic or admin */
function mechanicAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'mechanic' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Mechanic access required' });
    next();
  });
}

/** User (customer) or admin */
function userAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'user' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'User access required' });
    next();
  });
}

module.exports = { auth, adminAuth, mechanicAuth, userAuth };
