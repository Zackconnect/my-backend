require('dotenv').config();
const { connect, disconnect, initializeSchema } = require('./db/mysql');
const { seedDefaultBundles } = require('./data/defaultBundles');
const { createApp } = require('./app');

async function initialize() {
    const requiredEnvironment = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE', 'JWT_SECRET'];
    const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]);
    if (missingEnvironment.length) {
        throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
    }
    if (process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters.');
    }

    await connect();
    await initializeSchema();
    await seedDefaultBundles();
}

let initializationPromise;
function initializeOnce() {
    if (!initializationPromise) {
        initializationPromise = initialize().catch((error) => {
            initializationPromise = undefined;
            throw error;
        });
    }
    return initializationPromise;
}

const app = createApp({ beforeRequest: initializeOnce });

async function startLocal() {
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be a valid TCP port.');
    }
    await initializeOnce();
    const server = app.listen(port, () => {
        console.log(`Zackconnect API listening on port ${port}`);
    });

    async function shutdown(signal) {
        console.log(`${signal} received; closing the API server.`);
        server.close(async (error) => {
            if (error) {
                console.error('Unable to close the HTTP server cleanly.', error);
                process.exitCode = 1;
            }
            await disconnect();
            process.exit();
        });
    }
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;

if (require.main === module) {
    startLocal().catch((error) => {
        console.error('Unable to start the API server.', error);
        process.exit(1);
    });
}
