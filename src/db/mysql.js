const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST || '127.0.0.1',
            port: Number(process.env.MYSQL_PORT) || 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE || 'zackconnect',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

async function connect() {
    const pool = getPool();
    try {
        const connection = await pool.getConnection();
        console.log('MySQL database connected successfully.');
        connection.release();
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        throw error;
    }
}

async function disconnect() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('MySQL connection closed.');
    }
}

async function initializeSchema() {
    const pool = getPool();
    
    // Users table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(254) NOT NULL UNIQUE,
            phone VARCHAR(40) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Catalog items table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS catalog_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category ENUM('bundles', 'cars', 'tricycles') NOT NULL,
            item_id VARCHAR(120) NOT NULL,
            data JSON NOT NULL,
            bundle_network VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
            bundle_size VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_category_item (category, item_id),
            UNIQUE KEY unique_bundle_network_size (bundle_network, bundle_size)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    const [catalogColumns] = await pool.query('SHOW COLUMNS FROM catalog_items');
    const existingColumns = new Set(catalogColumns.map(column => column.Field));
    if (!existingColumns.has('bundle_network')) {
        await pool.execute(`
            ALTER TABLE catalog_items
            ADD COLUMN bundle_network VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
        `);
    }
    if (!existingColumns.has('bundle_size')) {
        await pool.execute(`
            ALTER TABLE catalog_items
            ADD COLUMN bundle_size VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
        `);
    }
    await pool.execute(`
        UPDATE catalog_items
        SET bundle_network = COALESCE(bundle_network, JSON_UNQUOTE(JSON_EXTRACT(data, '$.network'))),
            bundle_size = COALESCE(bundle_size, JSON_UNQUOTE(JSON_EXTRACT(data, '$.size')))
        WHERE category = 'bundles' AND (bundle_network IS NULL OR bundle_size IS NULL)
    `);
    const [catalogIndexes] = await pool.query('SHOW INDEX FROM catalog_items');
    if (!catalogIndexes.some(index => index.Key_name === 'unique_bundle_network_size')) {
        await pool.execute(`
            CREATE UNIQUE INDEX unique_bundle_network_size
            ON catalog_items (bundle_network, bundle_size)
        `);
    }

    // Enquiries table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            email VARCHAR(254) NOT NULL,
            service VARCHAR(160) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Software projects table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS software_projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(254) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            project_name VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            brief_name VARCHAR(255) DEFAULT '',
            brief_media_id VARCHAR(200) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Support messages table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS support_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            direction ENUM('incoming', 'outgoing') NOT NULL,
            text VARCHAR(4000) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_phone_created (phone, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('MySQL schema initialized.');
}

module.exports = { getPool, connect, disconnect, initializeSchema };
