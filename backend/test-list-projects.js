require('dotenv').config();
const db = require('./src/db');
async function test() {
  const users = await db.query("SELECT id, email, name FROM users");
  console.log("Users:", users.rows);
  
  for (const u of users.rows) {
    const p = await db.query(`
      SELECT p.id, p.name, COALESCE(MAX(pm.role), 'owner') AS user_role
       FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE p.user_id = $1 OR pm.user_id = $1
       GROUP BY p.id
    `, [u.id]);
    console.log(`Projects for ${u.email}:`, p.rows);
  }
  process.exit(0);
}
test();
