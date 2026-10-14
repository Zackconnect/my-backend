const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('node:path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const bundleOrderRoutes = require('./routes/bundleOrders');
const catalogRoutes = require('./routes/catalog');
const enquiryRoutes = require('./routes/enquiries');
const projectRoutes = require('./routes/projects');
const supportRoutes = require('./routes/support');

function createApp({ beforeRequest, app = express() } = {}) {

    app.disable('x-powered-by');
    app.use(helmet());
    app.use(cors({
        origin: process.env.CLIENT_ORIGIN
            ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
            : '*'
    }));
    app.use(express.json({ limit: '1mb' }));
    if (beforeRequest) {
        app.use((request, _response, next) => {
            if (request.path === '/api/health') return next();
            Promise.resolve()
                .then(beforeRequest)
                .then(() => next(), next);
        });
    }
    app.use('/api/auth', rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    }));
    app.use('/api', rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    }));

    app.get('/api/health', async (_request, response) => {
        try {
            if (beforeRequest) await beforeRequest();
            const { getDb } = require('./db/mongodb');
            const db = await getDb();
            await db.command({ ping: 1 });
            response.json({
                status: 'ok',
                database: 'connected',
                databaseType: 'mongodb'
            });
        } catch (error) {
            console.error('MongoDB health check failed:', error.message);
            response.status(503).json({
                status: 'unavailable',
                database: 'disconnected',
                databaseType: 'mongodb'
            });
        }
    });
    app.use('/api/auth', authRoutes);
    app.use('/api/bundle-orders', bundleOrderRoutes);
    app.use('/api/catalog', catalogRoutes);
    app.use('/api/enquiries', enquiryRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/support', supportRoutes);

    const clientDirectory = process.env.CLIENT_STATIC_DIR || path.resolve(__dirname, '..', '..', 'my-webapp');
    app.use(express.static(clientDirectory));

    app.use((_request, response) => {
        response.status(404).json({ error: 'Route not found.' });
    });
    app.use((error, _request, response, _next) => {
        if (error.type === 'entity.parse.failed') {
            return response.status(400).json({ error: 'Request body must contain valid JSON.' });
        }
        if (error.code === 11000) {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return response.status(400).json({ error: error.message });
        }
        console.error(error);
        return response.status(500).json({ error: 'An unexpected server error occurred.' });
    });

    return app;
}

module.exports = { createApp };
