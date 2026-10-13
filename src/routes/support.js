const express = require('express');
const SupportMessage = require('../models/SupportMessage');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const { requiredString } = require('../middleware/validate');

const router = express.Router();

router.post('/messages', async (request, response, next) => {
    try {
        const name = requiredString(request.body.name, 'Name', 120);
        const phone = requiredString(request.body.phone, 'Phone', 40);
        const text = requiredString(request.body.text, 'Message', 4000);
        const message = await SupportMessage.create({ name, phone, text, direction: 'outgoing' });
        return response.status(201).json({ message });
    } catch (error) {
        if (error.status === 400) return response.status(400).json({ error: error.message });
        return next(error);
    }
});

router.get('/messages', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const filter = request.query.phone
            ? { phone: requiredString(request.query.phone, 'Phone', 40) }
            : {};
        const messages = await SupportMessage.find(filter);
        return response.json({ messages });
    } catch (error) {
        if (error.status === 400) return response.status(400).json({ error: error.message });
        return next(error);
    }
});

router.post('/messages/:phone/reply', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const phone = requiredString(request.params.phone, 'Phone', 40);
        const text = requiredString(request.body.text, 'Message', 4000);
        const latestCustomerMessage = await SupportMessage.findOne({ phone });
        const message = await SupportMessage.create({
            name: latestCustomerMessage?.name || 'Customer',
            phone,
            text,
            direction: 'incoming'
        });
        return response.status(201).json({ message });
    } catch (error) {
        if (error.status === 400) return response.status(400).json({ error: error.message });
        return next(error);
    }
});

module.exports = router;
