require('dotenv').config();
const db = require('./src/db');
async function checkMembers() {
  const mems = await db.query(`
    SELECT pm.project_id, pm.role, u.email 
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
  `);
  console.log("Project Members:", mems.rows);
  process.exit(0);
}
checkMembers();
