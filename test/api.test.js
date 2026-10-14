const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../src/createApp');
const { disconnect } = require('../src/db/mongodb');
const { defaultBundles } = require('../src/data/defaultBundles');
const vercelApp = require('../src/server');

let server;
let baseUrl;

before(async () => {
    server = createApp().listen(0);
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
    await disconnect();
});

test('health endpoint reports current database readiness', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const health = await response.json();
    if (health.database === 'connected') {
        assert.equal(response.status, 200);
        assert.deepEqual(health, { status: 'ok', database: 'connected', databaseType: 'mongodb' });
    } else {
        assert.equal(response.status, 503);
        assert.deepEqual(health, {
            status: 'unavailable',
            database: 'disconnected',
            databaseType: 'mongodb'
        });
    }
});

test('frontend sign-in page is served over HTTP', async () => {
    const response = await fetch(`${baseUrl}/login.html`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<title>Login - Zackconnect<\/title>/);
});

test('server entry exports an Express app for Vercel', () => {
    assert.equal(typeof vercelApp, 'function');
    assert.equal(typeof vercelApp.listen, 'function');
});

test('unknown API routes return a JSON 404', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Route not found.' });
});

test('invalid enquiry input is rejected before database access', async () => {
    const response = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Name is required.' });
});

test('bundle orders require a bundle selection before database access', async () => {
    const response = await fetch(`${baseUrl}/api/bundle-orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Bundle is required.' });
});

test('unsupported catalog categories return 404', async () => {
    const response = await fetch(`${baseUrl}/api/catalog/unsupported`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Catalog not found.' });
});

test('catalog mutations require an authenticated administrator', async () => {
    const response = await fetch(`${baseUrl}/api/catalog/cars`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item: { id: 'car-1' } })
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Sign in to access this resource.' });
});

test('default bundle catalog has unique identifiers and network-size combinations', () => {
    assert.equal(defaultBundles.length, 36);
    assert.equal(new Set(defaultBundles.map(bundle => bundle.id)).size, defaultBundles.length);
    assert.equal(
        new Set(defaultBundles.map(bundle => `${bundle.network}:${bundle.size}`)).size,
        defaultBundles.length
    );
    assert.ok(defaultBundles.every(bundle =>
        bundle.price > 0 && bundle.validity === 'No-Expiry'
    ));
});
