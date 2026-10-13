const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/authenticate');
const { emailAddress, handleValidationError, requiredString } = require('../middleware/validate');

const router = express.Router();

function issueToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };
}

router.post('/register', async (request, response, next) => {
    try {
        const name = requiredString(request.body.name, 'Name', 120);
        const email = emailAddress(request.body.email);
        const phone = requiredString(request.body.phone, 'Phone', 40);
        const password = requiredString(request.body.password, 'Password', 128);
        if (password.length < 8) {
            return response.status(400).json({ error: 'Password must contain at least 8 characters.' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOneByEmail(email);
        if (existingUser) {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        
        const user = await User.create({
            name,
            email,
            phone,
            passwordHash: await bcrypt.hash(password, 12)
        });
        return response.status(201).json({ token: issueToken(user), user: publicUser(user) });
    } catch (error) {
        return handleValidationError(error, response, next);
    }
});

router.post('/login', async (request, response, next) => {
    try {
        const email = emailAddress(request.body.email);
        const password = requiredString(request.body.password, 'Password', 128);
        const user = await User.findOneByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return response.status(401).json({ error: 'Email or password is incorrect.' });
        }
        return response.json({ token: issueToken(user), user: publicUser(user) });
    } catch (error) {
        return handleValidationError(error, response, next);
    }
});

router.get('/me', authenticate, (request, response) => {
    response.json({ user: publicUser(request.user) });
});

module.exports = router;
