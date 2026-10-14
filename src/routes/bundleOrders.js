const express = require('express');
const BundleOrder = require('../models/BundleOrder');
const CatalogItem = require('../models/CatalogItem');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const { emailAddress, requiredString } = require('../middleware/validate');

const router = express.Router();

router.post('/', async (request, response, next) => {
    try {
        const bundleId = requiredString(request.body.bundleId, 'Bundle', 120);
        const recipientPhone = requiredString(request.body.recipientPhone, 'Recipient phone', 40);
        const email = typeof request.body.email === 'string' && request.body.email.trim()
            ? emailAddress(request.body.email)
            : '';
        const bundle = await CatalogItem.findOneByItemId('bundles', bundleId);
        if (!bundle) return response.status(404).json({ error: 'The selected bundle is no longer available.' });

        const order = await BundleOrder.create({ bundle, recipientPhone, email });
        return response.status(201).json({ order });
    } catch (error) {
        if (error.status === 400) return response.status(400).json({ error: error.message });
        return next(error);
    }
});

router.get('/', authenticate, requireAdmin, async (_request, response, next) => {
    try {
        const orders = await BundleOrder.findAll();
        return response.json({ orders });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
