const { MongoClient, ObjectId } = require('mongodb');

let client;
let connectionPromise;

async function connect() {
    if (!connectionPromise) {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is required.');

        client = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000
        });
        connectionPromise = client.connect().then(() => {
            const databaseName = process.env.MONGODB_DATABASE || 'zackconnect';
            return client.db(databaseName);
        }).catch((error) => {
            client = undefined;
            connectionPromise = undefined;
            throw error;
        });
    }
    return connectionPromise;
}

async function getDb() {
    if (!connectionPromise) {
        throw new Error('MongoDB is not connected.');
    }
    return connectionPromise;
}

async function disconnect() {
    if (client) await client.close();
    client = undefined;
    connectionPromise = undefined;
}

async function initializeSchema() {
    const db = await getDb();
    await Promise.all([
        db.collection('users').createIndex({ email: 1 }, { unique: true }),
        db.collection('catalog_items').createIndex(
            { category: 1, item_id: 1 },
            { unique: true, name: 'unique_category_item' }
        ),
        db.collection('catalog_items').createIndex(
            { bundle_network: 1, bundle_size: 1 },
            {
                unique: true,
                name: 'unique_bundle_network_size',
                partialFilterExpression: { category: 'bundles' }
            }
        ),
        db.collection('enquiries').createIndex({ created_at: -1 }),
        db.collection('software_projects').createIndex({ created_at: -1 }),
        db.collection('support_messages').createIndex({ phone: 1, created_at: 1 }),
        db.collection('bundle_orders').createIndex(
            { order_code: 1 },
            { unique: true, name: 'unique_bundle_order_code' }
        ),
        db.collection('bundle_orders').createIndex({ created_at: -1 })
    ]);
    console.log('MongoDB indexes initialized.');
}

function toObjectId(id) {
    return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

module.exports = { connect, disconnect, getDb, initializeSchema, toObjectId };
