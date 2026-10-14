require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connect, disconnect } = require('../src/db/mongodb');
const User = require('../src/models/User');

async function main() {
    const [emailInput, ...passwordParts] = process.argv.slice(2);
    const email = (emailInput || '').trim().toLowerCase();
    const password = passwordParts.join(' ');
    if (!process.env.MONGODB_URI) {
        throw new Error('Set MONGODB_URI in .env before creating an admin.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Usage: npm run create-admin -- admin@example.com "strong-password"');
    }
    if (password.length < 12) throw new Error('Admin password must contain at least 12 characters.');

    await connect();
    const user = await User.findOneByEmail(email);
    if (!user) throw new Error('No account exists for this email. Register the account first.');
    
    await User.updateAdminCredentials(user.id, await bcrypt.hash(password, 12));
    console.log(`Administrator access enabled for ${email}.`);
}

main()
    .catch((error) => {
        console.error('Unable to create administrator.', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnect();
    });
