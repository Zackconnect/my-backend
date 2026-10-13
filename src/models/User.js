const { getPool } = require('../db/mysql');

async function create(userData) {
    const pool = getPool();
    const [result] = await pool.execute(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [userData.name, userData.email.toLowerCase(), userData.phone, userData.passwordHash, userData.role || 'customer']
    );
    return { id: result.insertId, ...userData };
}

async function findOneByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
}

async function findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT id, name, email, phone, role FROM users WHERE id = ?',
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

async function findByIdWithPassword(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { create, findOneByEmail, findById, findByIdWithPassword };
