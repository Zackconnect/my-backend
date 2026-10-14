const { randomBytes } = require('node:crypto');
const { getDb } = require('../db/mongodb');

function toOrder(document) {
    if (!document) return null;
    const { _id, ...order } = document;
    return { ...order, id: _id.toHexString() };
}

async function create({ bundle, recipientPhone, email }) {
    const db = await getDb();
    const document = {
        order_code: `ORD-${randomBytes(6).toString('hex').toUpperCase()}`,
        bundle_id: bundle.item_id,
        network: bundle.data.network,
        size: bundle.data.size,
        price: bundle.data.price,
        recipient_phone: recipientPhone,
        email,
        status: 'Pending payment',
        created_at: new Date(),
        updated_at: new Date()
    };
    const result = await db.collection('bundle_orders').insertOne(document);
    return { id: result.insertedId.toHexString(), ...document };
}

async function findAll() {
    const db = await getDb();
    const documents = await db.collection('bundle_orders').find().sort({ created_at: -1, _id: -1 }).toArray();
    return documents.map(toOrder);
}

module.exports = { create, findAll };
