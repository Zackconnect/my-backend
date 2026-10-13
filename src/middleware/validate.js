function requiredString(value, field, maximum = 5000) {
    if (typeof value !== 'string' || !value.trim()) {
        const error = new Error(`${field} is required.`);
        error.status = 400;
        throw error;
    }
    const normalized = value.trim();
    if (normalized.length > maximum) {
        const error = new Error(`${field} must be ${maximum} characters or fewer.`);
        error.status = 400;
        throw error;
    }
    return normalized;
}

function emailAddress(value) {
    const email = requiredString(value, 'Email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const error = new Error('Enter a valid email address.');
        error.status = 400;
        throw error;
    }
    return email;
}

function handleValidationError(error, response, next) {
    if (error.status === 400) return response.status(400).json({ error: error.message });
    return next(error);
}

module.exports = { requiredString, emailAddress, handleValidationError };
