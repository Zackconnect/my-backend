const { getDb } = require('../db/mongodb');

function toCatalogItem(document) {
    if (!document) return null;
    const { _id, ...item } = document;
    return { ...item, id: _id.toHexString() };
}

function catalogDocument(itemData) {
    return {
        category: itemData.category,
        item_id: itemData.itemId,
        data: itemData.data,
        bundle_network: itemData.category === 'bundles' ? itemData.data.network : null,
        bundle_size: itemData.category === 'bundles' ? itemData.data.size : null,
        created_at: new Date(),
        updated_at: new Date()
    };
}

async function create(itemData) {
    const db = await getDb();
    const document = catalogDocument(itemData);
    const result = await db.collection('catalog_items').insertOne(document);
    return { id: result.insertedId.toHexString(), ...itemData, item_id: itemData.itemId };
}

async function findByCategory(category) {
    const db = await getDb();
    const documents = await db.collection('catalog_items')
        .find({ category })
        .sort({ created_at: 1, _id: 1 })
        .toArray();
    return documents.map(toCatalogItem);
}

async function findOneByItemId(category, itemId) {
    const db = await getDb();
    return toCatalogItem(await db.collection('catalog_items').findOne({ category, item_id: itemId }));
}

async function findOneAndUpdate(category, itemId, newData) {
    const db = await getDb();
    const collection = db.collection('catalog_items');
    const result = await collection.findOneAndUpdate(
        { category, item_id: itemId },
        {
            $set: {
                data: newData,
                bundle_network: category === 'bundles' ? newData.network : null,
                bundle_size: category === 'bundles' ? newData.size : null,
                updated_at: new Date()
            }
        },
        { returnDocument: 'after' }
    );
    return toCatalogItem(result);
}

async function findOneAndDelete(category, itemId) {
    const db = await getDb();
    const document = await db.collection('catalog_items').findOneAndDelete({ category, item_id: itemId });
    return toCatalogItem(document);
}

async function exists(category) {
    const db = await getDb();
    return (await db.collection('catalog_items').countDocuments({ category }, { limit: 1 })) > 0;
}

async function insertMany(items) {
    if (items.length === 0) return;
    const db = await getDb();
    await db.collection('catalog_items').bulkWrite(items.map((item) => {
        const document = catalogDocument(item);
        return {
            updateOne: {
                filter: { category: document.category, item_id: document.item_id },
                update: { $setOnInsert: document },
                upsert: true
            }
        };
    }));
}

module.exports = {
    create,
    findByCategory,
    findOneByItemId,
    findOneAndUpdate,
    findOneAndDelete,
    exists,
    insertMany
};
