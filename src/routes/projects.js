const express = require('express');
const SoftwareProject = require('../models/SoftwareProject');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const { emailAddress, handleValidationError, requiredString } = require('../middleware/validate');

const router = express.Router();

router.post('/', async (request, response, next) => {
    try {
        const project = await SoftwareProject.create({
            name: requiredString(request.body.name, 'Name', 120),
            email: emailAddress(request.body.email),
            phone: requiredString(request.body.phone, 'Phone', 40),
            projectName: requiredString(request.body.projectName, 'Project name', 200),
            description: requiredString(request.body.description, 'Description', 10000),
            briefName: typeof request.body.briefName === 'string' ? request.body.briefName.trim() : '',
            briefMediaId: typeof request.body.briefMediaId === 'string' ? request.body.briefMediaId.trim() : ''
        });
        return response.status(201).json({ project });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        return handleValidationError(error, response, next);
    }
});

router.get('/', authenticate, requireAdmin, async (_request, response, next) => {
    try {
        const projects = await SoftwareProject.findAll();
        return response.json({ projects });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
