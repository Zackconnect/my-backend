const { getPool } = require('../db/mysql');

async function create(itemData) {
    const pool = getPool();
    const [result] = await pool.execute(
        `INSERT INTO catalog_items
            (category, item_id, data, bundle_network, bundle_size)
         VALUES (?, ?, ?, ?, ?)`,
        [
            itemData.category,
            itemData.itemId,
            JSON.stringify(itemData.data),
            itemData.category === 'bundles' ? itemData.data.network : null,
            itemData.category === 'bundles' ? itemData.data.size : null
        ]
    );
    return { id: result.insertId, ...itemData };
}

async function findByCategory(category) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM catalog_items WHERE category = ? ORDER BY created_at ASC',
        [category]
    );
    return rows.map(row => ({
        ...row,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
}

async function findOneAndUpdate(category, itemId, newData) {
    const pool = getPool();
    const [result] = await pool.execute(
        `UPDATE catalog_items
         SET data = ?, bundle_network = ?, bundle_size = ?
         WHERE category = ? AND item_id = ?`,
        [
            JSON.stringify(newData),
            category === 'bundles' ? newData.network : null,
            category === 'bundles' ? newData.size : null,
            category,
            itemId
        ]
    );
    if (result.affectedRows === 0) {
        const [existing] = await pool.execute(
            'SELECT id FROM catalog_items WHERE category = ? AND item_id = ? LIMIT 1',
            [category, itemId]
        );
        if (!existing.length) return null;
    }
    const [rows] = await pool.execute(
        'SELECT * FROM catalog_items WHERE category = ? AND item_id = ?',
        [category, itemId]
    );
    return rows.length > 0
        ? {
            ...rows[0],
            data: typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data
        }
        : null;
}

async function findOneAndDelete(category, itemId) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM catalog_items WHERE category = ? AND item_id = ?',
        [category, itemId]
    );
    if (rows.length === 0) return null;
    await pool.execute(
        'DELETE FROM catalog_items WHERE category = ? AND item_id = ?',
        [category, itemId]
    );
    return rows[0];
}

async function exists(category) {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM catalog_items WHERE category = ?',
        [category]
    );
    return rows[0].count > 0;
}

async function insertMany(items) {
    const pool = getPool();
    const values = items.map(item => [
        item.category,
        item.itemId,
        JSON.stringify(item.data),
        item.category === 'bundles' ? item.data.network : null,
        item.category === 'bundles' ? item.data.size : null
    ]);
    await pool.query(
        `INSERT INTO catalog_items
            (category, item_id, data, bundle_network, bundle_size)
         VALUES ?`,
        [values]
    );
}

module.exports = { create, findByCategory, findOneAndUpdate, findOneAndDelete, exists, insertMany };
