require('dotenv').config();
const { connect, disconnect, initializeSchema } = require('./db/mysql');
const { seedDefaultBundles } = require('./data/defaultBundles');
const { createApp } = require('./app');

const requiredEnvironment = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE', 'JWT_SECRET'];
const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]);
if (missingEnvironment.length) {
    console.error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must contain at least 32 characters.');
    process.exit(1);
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be a valid TCP port.');
    process.exit(1);
}

async function start() {
    await connect();
    await initializeSchema();
    await seedDefaultBundles();
    const server = createApp().listen(port, () => {
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

start().catch((error) => {
    console.error('Unable to start the API server.', error);
    process.exit(1);
});
