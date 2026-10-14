const { getDb, toObjectId } = require('../db/mongodb');

function toUser(document) {
    if (!document) return null;
    const { _id, ...user } = document;
    return { ...user, id: _id.toHexString() };
}

async function create(userData) {
    const db = await getDb();
    const user = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        password_hash: userData.passwordHash,
        role: userData.role || 'customer',
        created_at: new Date(),
        updated_at: new Date()
    };
    const result = await db.collection('users').insertOne(user);
    return { id: result.insertedId.toHexString(), ...userData };
}

async function findOneByEmail(email) {
    const db = await getDb();
    return toUser(await db.collection('users').findOne({ email: email.toLowerCase() }));
}

async function findById(id) {
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const db = await getDb();
    const user = await db.collection('users').findOne(
        { _id: objectId },
        { projection: { password_hash: 0 } }
    );
    return toUser(user);
}

async function findByIdWithPassword(id) {
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const db = await getDb();
    return toUser(await db.collection('users').findOne({ _id: objectId }));
}

async function updateAdminCredentials(id, passwordHash) {
    const objectId = toObjectId(id);
    if (!objectId) return false;
    const db = await getDb();
    const result = await db.collection('users').updateOne(
        { _id: objectId },
        { $set: { role: 'admin', password_hash: passwordHash, updated_at: new Date() } }
    );
    return result.matchedCount > 0;
}

module.exports = { create, findOneByEmail, findById, findByIdWithPassword, updateAdminCredentials };
