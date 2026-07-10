const db = require('./src/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Dropping project_members...');
    await db.query(`DROP TABLE IF EXISTS project_members`);
    
    console.log('Running schema migration...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf-8');
    await db.query(schemaSql);
    console.log('Schema updated.');

    const res = await db.query(
      `INSERT INTO project_members (project_id, user_id, role)
       SELECT id, user_id, 'OWNER'
       FROM projects
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING id`
    );
    console.log(`Migrated ${res.rowCount} project owners to project_members table.`);

  } catch (err) {
    console.error("Migration Error:", err.message);
  } finally {
    process.exit(0);
  }
}
migrate();
