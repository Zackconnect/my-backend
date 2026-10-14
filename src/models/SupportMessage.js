const { getDb } = require('../db/mongodb');

function toMessage(document) {
    if (!document) return null;
    const { _id, ...message } = document;
    return { ...message, id: _id.toHexString() };
}

async function create(messageData) {
    const db = await getDb();
    const document = {
        name: messageData.name,
        phone: messageData.phone,
        direction: messageData.direction,
        text: messageData.text,
        created_at: new Date(),
        updated_at: new Date()
    };
    const result = await db.collection('support_messages').insertOne(document);
    return { id: result.insertedId.toHexString(), ...messageData };
}

async function find(filter = {}) {
    const db = await getDb();
    const query = filter.phone ? { phone: filter.phone } : {};
    const documents = await db.collection('support_messages')
        .find(query)
        .sort({ created_at: 1, _id: 1 })
        .toArray();
    return documents.map(toMessage);
}

async function findOne(filter) {
    const db = await getDb();
    return toMessage(await db.collection('support_messages')
        .findOne({ phone: filter.phone }, { sort: { created_at: -1, _id: -1 } }));
}

module.exports = { create, find, findOne };
