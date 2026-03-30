function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
