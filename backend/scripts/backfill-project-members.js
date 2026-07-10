require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

async function runMigration() {
  console.log('Starting backfill for project_members...');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Find all projects that DO NOT have an owner in project_members
    const result = await client.query(`
      SELECT id, user_id
      FROM projects p
      WHERE NOT EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.role = 'owner'
      )
    `);

    if (result.rows.length === 0) {
      console.log('All projects already have owners. No migration needed.');
    } else {
      console.log(`Found ${result.rows.length} projects needing an owner backfill.`);
      
      for (const project of result.rows) {
        await client.query(
          `INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4)`,
          [uuidv4(), project.id, project.user_id, 'owner']
        );
        console.log(`- Inserted owner membership for project ${project.id}`);
      }
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
