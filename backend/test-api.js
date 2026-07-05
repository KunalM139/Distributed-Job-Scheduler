require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testApi() {
  const adminToken = jwt.sign(
    { id: 'e320def5-db31-46ae-93fb-5bfb76caa78c', email: 'admin1@gmail.com', name: 'Admin User' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  try {
    const pRes = await fetch('http://localhost:3000/api/projects', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const projs = await pRes.json();
    console.log("Admin Projects:", projs.data.length);
    
    if (projs.data.length > 0) {
      const pId = projs.data[0].id;
      const qRes = await fetch(`http://localhost:3000/api/projects/${pId}/queues`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const queues = await qRes.json();
      console.log("Admin Queues:", queues.data.length);
      
      const sRes = await fetch('http://localhost:3000/api/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const stats = await sRes.json();
      console.log("Admin Stats (Total Jobs):", stats.data.total_jobs);
    }
  } catch (err) {
    console.error("API Error:", err);
  }
}
testApi();
