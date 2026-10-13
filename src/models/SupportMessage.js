const { getPool } = require('../db/mysql');

async function create(messageData) {
    const pool = getPool();
    const [result] = await pool.execute(
        'INSERT INTO support_messages (name, phone, direction, text) VALUES (?, ?, ?, ?)',
        [messageData.name, messageData.phone, messageData.direction, messageData.text]
    );
    return { id: result.insertId, ...messageData };
}

async function find(filter = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM support_messages';
    const params = [];
    
    if (filter.phone) {
        query += ' WHERE phone = ?';
        params.push(filter.phone);
    }
    
    query += ' ORDER BY created_at ASC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
}

async function findOne(filter) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM support_messages WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [filter.phone]
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = { create, find, findOne };
