require('dotenv').config();
const db = require('./src/db');
async function checkAll() {
  const users = await db.query("SELECT id, email FROM users");
  const projects = await db.query("SELECT id, name, user_id FROM projects");
  const members = await db.query("SELECT project_id, user_id, role FROM project_members");
  const queues = await db.query("SELECT id, name, project_id FROM queues");
  const jobs = await db.query("SELECT id, queue_id FROM jobs");
  
  console.log("Projects:", projects.rows);
  console.log("Members:", members.rows.map(m => {
    const user = users.rows.find(u => u.id === m.user_id);
    return { ...m, email: user ? user.email : 'Unknown' };
  }));
  console.log("Queues:", queues.rows);
  console.log("Jobs count:", jobs.rows.length);
  process.exit(0);
}
checkAll();
