// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Middleware to check for admin privileges
const isAdmin = (req, res, next) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin
};