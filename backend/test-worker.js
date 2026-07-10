const { v4: uuidv4 } = require('uuid');
const db = require('./src/db');
const worker = require('./src/workers/worker');

async function testWorkerFailure() {
  try {
    // 1. Clear DB
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM queues");
    await db.query("DELETE FROM projects");
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM dead_letter_queue");

    // 2. Setup
    const userId = uuidv4();
    await db.query("INSERT INTO users (id, email, password_hash, name) VALUES ($1, 'test@test.com', 'hash', 'Test')", [userId]);
    const projectId = uuidv4();
    await db.query("INSERT INTO projects (id, user_id, name) VALUES ($1, $2, 'Proj')", [projectId, userId]);
    const queueId = uuidv4();
    await db.query("INSERT INTO queues (id, project_id, name, concurrency_limit) VALUES ($1, $2, 'Q1', 5)", [queueId, projectId]);

    // 3. Insert 15 jobs
    for(let i = 0; i < 15; i++) {
      await db.query("INSERT INTO jobs (id, queue_id, type) VALUES ($1, $2, 'test-job')", [uuidv4(), queueId]);
    }

    worker.setWorkerId(uuidv4());
    
    // Simulate what poll() and executeJob() do OVER A LONGER TIME to let scheduled_at pass
    for (let i = 0; i < 60; i++) {
       const claimed = await worker.claimJob();
       if (claimed) {
         console.log(`Claimed Job ${claimed.job.id} Attempt ${claimed.job.attempt_count}`);
         await worker.onJobFailure(claimed.job, claimed.executionId, "Failed manually");
       } else {
         // Fast forward time by updating scheduled_at
         await db.query("UPDATE jobs SET scheduled_at = NOW() WHERE status = 'queued'");
       }
    }
    
    const counts = await db.query("SELECT status, attempt_count, count(*) FROM jobs GROUP BY status, attempt_count");
    console.log("Job status counts:", counts.rows);
    const dlq = await db.query("SELECT count(*) FROM dead_letter_queue");
    console.log("DLQ Count:", dlq.rows[0].count);

  } catch(e) {
    console.error("TEST FAILED:", e);
  } finally {
    process.exit(0);
  }
}

testWorkerFailure();
