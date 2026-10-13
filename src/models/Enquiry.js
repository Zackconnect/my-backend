const { getPool } = require('../db/mysql');

async function create(enquiryData) {
    const pool = getPool();
    const [result] = await pool.execute(
        'INSERT INTO enquiries (name, phone, email, service, message, status) VALUES (?, ?, ?, ?, ?, ?)',
        [enquiryData.name, enquiryData.phone, enquiryData.email.toLowerCase(), enquiryData.service, enquiryData.message, enquiryData.status || 'Pending']
    );
    return { id: result.insertId, ...enquiryData };
}

async function findAll() {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM enquiries ORDER BY created_at DESC'
    );
    return rows;
}

async function findByIdAndUpdate(id, status) {
    const pool = getPool();
    const [result] = await pool.execute(
        'UPDATE enquiries SET status = ? WHERE id = ?',
        [status, id]
    );
    if (result.affectedRows === 0) return null;
    const [rows] = await pool.execute(
        'SELECT * FROM enquiries WHERE id = ?',
        [id]
    );
    return rows[0];
}

module.exports = { create, findAll, findByIdAndUpdate };
