const { getDb, toObjectId } = require('../db/mongodb');

function toRecord(document) {
    if (!document) return null;
    const { _id, ...record } = document;
    return { ...record, id: _id.toHexString() };
}

async function create(enquiryData) {
    const db = await getDb();
    const document = {
        name: enquiryData.name,
        phone: enquiryData.phone,
        email: enquiryData.email.toLowerCase(),
        service: enquiryData.service,
        message: enquiryData.message,
        status: enquiryData.status || 'Pending',
        created_at: new Date(),
        updated_at: new Date()
    };
    const result = await db.collection('enquiries').insertOne(document);
    return { id: result.insertedId.toHexString(), ...enquiryData };
}

async function findAll() {
    const db = await getDb();
    const documents = await db.collection('enquiries').find().sort({ created_at: -1, _id: -1 }).toArray();
    return documents.map(toRecord);
}

async function findByIdAndUpdate(id, status) {
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const db = await getDb();
    const document = await db.collection('enquiries').findOneAndUpdate(
        { _id: objectId },
        { $set: { status, updated_at: new Date() } },
        { returnDocument: 'after' }
    );
    return toRecord(document);
}

module.exports = { create, findAll, findByIdAndUpdate };
