const { getDb } = require('../db/mongodb');

function toProject(document) {
    if (!document) return null;
    const { _id, ...project } = document;
    return { ...project, id: _id.toHexString() };
}

async function create(projectData) {
    const db = await getDb();
    const document = {
        name: projectData.name,
        email: projectData.email.toLowerCase(),
        phone: projectData.phone,
        project_name: projectData.projectName,
        description: projectData.description,
        brief_name: projectData.briefName || '',
        brief_media_id: projectData.briefMediaId || '',
        created_at: new Date(),
        updated_at: new Date()
    };
    const result = await db.collection('software_projects').insertOne(document);
    return { id: result.insertedId.toHexString(), ...projectData };
}

async function findAll() {
    const db = await getDb();
    const documents = await db.collection('software_projects').find().sort({ created_at: -1, _id: -1 }).toArray();
    return documents.map(toProject);
}

module.exports = { create, findAll };
