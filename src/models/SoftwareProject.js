const { getPool } = require('../db/mysql');

async function create(projectData) {
    const pool = getPool();
    const [result] = await pool.execute(
        'INSERT INTO software_projects (name, email, phone, project_name, description, brief_name, brief_media_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [projectData.name, projectData.email.toLowerCase(), projectData.phone, projectData.projectName, projectData.description, projectData.briefName || '', projectData.briefMediaId || '']
    );
    return { id: result.insertId, ...projectData };
}

async function findAll() {
    const pool = getPool();
    const [rows] = await pool.execute(
        'SELECT * FROM software_projects ORDER BY created_at DESC'
    );
    return rows;
}

module.exports = { create, findAll };
