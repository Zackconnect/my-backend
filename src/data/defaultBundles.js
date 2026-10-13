const CatalogItem = require('../models/CatalogItem');

const defaultBundles = [
    ['MTN', '1GB', 4.9], ['MTN', '2GB', 9.8], ['MTN', '3GB', 16], ['MTN', '4GB', 19.5],
    ['MTN', '5GB', 23.5], ['MTN', '6GB', 29], ['MTN', '8GB', 37], ['MTN', '10GB', 44],
    ['MTN', '15GB', 64], ['MTN', '20GB', 84], ['MTN', '25GB', 105], ['MTN', '30GB', 128],
    ['MTN', '40GB', 167], ['MTN', '50GB', 215], ['MTN', '100GB', 365], ['MTN', '200GB', 420]
].map(([network, size, price], index) => ({
    id: `seed-bundle-${index + 1}`,
    network,
    size,
    price,
    validity: 'No-Expiry'
})).concat([
    ['10GB', 45], ['15GB', 65], ['20GB', 83], ['25GB', 100],
    ['30GB', 118], ['50GB', 200], ['100GB', 395]
].map(([size, price], index) => ({
    id: `seed-bundle-telecel-${index + 1}`,
    network: 'TELECEL',
    size,
    price,
    validity: 'No-Expiry'
}))).concat([
    ['1GB', 4.5], ['2GB', 9], ['3GB', 13.5], ['4GB', 17.5],
    ['5GB', 22], ['6GB', 25], ['7GB', 30], ['8GB', 33],
    ['10GB', 41], ['15GB', 61], ['20GB', 80], ['25GB', 100], ['50GB', 200]
].map(([size, price], index) => ({
    id: `seed-bundle-airteltigo-${index + 1}`,
    network: 'AIRTELTIGO',
    size,
    price,
    validity: 'No-Expiry'
})));

async function seedDefaultBundles() {
    const existing = await CatalogItem.exists('bundles');
    if (existing) return;
    await CatalogItem.insertMany(defaultBundles.map(({ id, ...data }) => ({
        category: 'bundles',
        itemId: id,
        data: { id, ...data }
    })));
    console.log(`Seeded ${defaultBundles.length} default data bundles.`);
}

module.exports = { defaultBundles, seedDefaultBundles };
