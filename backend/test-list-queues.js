require('dotenv').config();
const db = require('./src/db');
async function test() {
  const users = await db.query("SELECT id, email, name FROM users");
  const projectId = 'c0323ba9-642a-428d-a312-bcc4e08ed3c5';
  
  for (const u of users.rows) {
    if (['owner1@gmail.com', 'admin1@gmail.com', 'viewer1@gmail.com'].includes(u.email)) {
      const q = await db.query(`
        SELECT q.*, rp.strategy
        FROM queues q
        LEFT JOIN retry_policies rp ON rp.id = q.retry_policy_id
        WHERE q.project_id = $1
      `, [projectId]);
      console.log(`Queues for project viewed by ${u.email}:`, q.rows);
    }
  }
  process.exit(0);
}
test();
