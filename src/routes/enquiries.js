const express = require('express');
const Enquiry = require('../models/Enquiry');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const { emailAddress, handleValidationError, requiredString } = require('../middleware/validate');

const router = express.Router();
const enquiryStatuses = new Set(['Pending', 'In Progress', 'Completed']);

router.post('/', async (request, response, next) => {
    try {
        const enquiry = await Enquiry.create({
            name: requiredString(request.body.name, 'Name', 120),
            phone: requiredString(request.body.phone, 'Phone', 40),
            email: emailAddress(request.body.email),
            service: requiredString(request.body.service, 'Service', 160),
            message: requiredString(request.body.message, 'Message', 10000)
        });
        return response.status(201).json({ enquiry });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ error: 'A record with those details already exists.' });
        }
        return handleValidationError(error, response, next);
    }
});

router.get('/', authenticate, requireAdmin, async (_request, response, next) => {
    try {
        const enquiries = await Enquiry.findAll();
        return response.json({ enquiries });
    } catch (error) {
        return next(error);
    }
});

router.patch('/:id/status', authenticate, requireAdmin, async (request, response, next) => {
    const status = request.body.status;
    if (!enquiryStatuses.has(status)) {
        return response.status(400).json({ error: 'Status must be Pending, In Progress, or Completed.' });
    }
    try {
        const enquiry = await Enquiry.findByIdAndUpdate(request.params.id, status);
        if (!enquiry) return response.status(404).json({ error: 'Enquiry not found.' });
        return response.json({ enquiry });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
