const express = require('express');
const CatalogItem = require('../models/CatalogItem');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const { requiredString } = require('../middleware/validate');

const router = express.Router();
const categories = new Set(['bundles', 'cars', 'tricycles']);
const networks = new Set(['MTN', 'TELECEL', 'AIRTELTIGO', 'AFA REG.']);

function validateItem(category, data, response) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        response.status(400).json({ error: 'Provide the catalog item in an item object.' });
        return false;
    }
    if (category !== 'bundles') return true;
    if (!networks.has(data.network)) {
        response.status(400).json({ error: 'Choose a supported bundle network.' });
        return false;
    }
    if (typeof data.size !== 'string' || !data.size.trim() || data.size.length > 40) {
        response.status(400).json({ error: 'Bundle size is required and must be 40 characters or fewer.' });
        return false;
    }
    if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price <= 0) {
        response.status(400).json({ error: 'Bundle price must be a number greater than zero.' });
        return false;
    }
    if (typeof data.validity !== 'string' || !data.validity.trim() || data.validity.length > 80) {
        response.status(400).json({ error: 'Bundle validity is required and must be 80 characters or fewer.' });
        return false;
    }
    return true;
}

router.param('category', (request, response, next, category) => {
    if (!categories.has(category)) return response.status(404).json({ error: 'Catalog not found.' });
    request.catalogCategory = category;
    return next();
});

router.get('/:category', async (request, response, next) => {
    try {
        const items = await CatalogItem.findByCategory(request.catalogCategory);
        return response.json({ items: items.map(item => ({ ...item.data, id: item.item_id })) });
    } catch (error) {
        return next(error);
    }
});

router.post('/:category', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const data = request.body.item;
        if (!validateItem(request.catalogCategory, data, response)) return;
        const itemId = requiredString(data.id, 'Item id', 120);
        const item = await CatalogItem.create({ category: request.catalogCategory, itemId, data });
        return response.status(201).json({ item: { ...item.data, id: item.item_id } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        if (error.status === 400) return response.status(400).json({ error: error.message });
        return next(error);
    }
});

router.put('/:category/:id', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const data = request.body.item;
        if (!validateItem(request.catalogCategory, data, response)) return;
        const item = await CatalogItem.findOneAndUpdate(
            request.catalogCategory,
            request.params.id,
            { ...data, id: request.params.id }
        );
        if (!item) return response.status(404).json({ error: 'Catalog item not found.' });
        return response.json({ item: { ...item.data, id: item.item_id } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        return next(error);
    }
});

router.delete('/:category/:id', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const item = await CatalogItem.findOneAndDelete(
            request.catalogCategory,
            request.params.id
        );
        if (!item) return response.status(404).json({ error: 'Catalog item not found.' });
        return response.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
