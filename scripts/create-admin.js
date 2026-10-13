require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connect, disconnect, getPool } = require('../src/db/mysql');
const User = require('../src/models/User');

async function main() {
    const [emailInput, ...passwordParts] = process.argv.slice(2);
    const email = (emailInput || '').trim().toLowerCase();
    const password = passwordParts.join(' ');
    if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
        throw new Error('Set MySQL connection variables in .env before creating an admin.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Usage: npm run create-admin -- admin@example.com "strong-password"');
    }
    if (password.length < 12) throw new Error('Admin password must contain at least 12 characters.');

    await connect();
    const user = await User.findOneByEmail(email);
    if (!user) throw new Error('No account exists for this email. Register the account first.');
    
    const pool = getPool();
    await pool.execute(
        'UPDATE users SET role = ?, password_hash = ? WHERE id = ?',
        ['admin', await bcrypt.hash(password, 12), user.id]
    );
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
