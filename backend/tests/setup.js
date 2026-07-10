const fs = require('fs');
const path = require('path');
const db = require('../src/db');

beforeAll(async () => {
  // Assume schema is already applied to test database
});

beforeEach(async () => {
  // Clear all tables before each test
  try {
    await db.query(`
      TRUNCATE TABLE 
        job_logs, 
        job_executions, 
        dead_letter_queue, 
        jobs, 
        scheduled_jobs,
        worker_heartbeats, 
        workers, 
        queues, 
        retry_policies, 
        projects, 
        users
      CASCADE;
    `);
  } catch (err) {
    console.error('TRUNCATE error:', err);
    throw err;
  }
});

afterAll(async () => {
  await db.pool.end();
});
