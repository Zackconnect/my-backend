const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(request, response, next) {
    const authorization = request.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return response.status(401).json({ error: 'Sign in to access this resource.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (!user) return response.status(401).json({ error: 'This account is no longer available.' });
        request.user = user;
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' });
        }
        return next(error);
    }
}

function requireAdmin(request, response, next) {
    if (request.user?.role !== 'admin') {
        return response.status(403).json({ error: 'Administrator access is required.' });
    }
    return next();
}

module.exports = { authenticate, requireAdmin };
