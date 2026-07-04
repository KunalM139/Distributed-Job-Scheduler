const request = require('supertest');
const app = require('../backend/server');
const db = require('../backend/src/db');
const worker = require('../backend/src/workers/worker');
const { v4: uuidv4 } = require('uuid');

describe('Worker Logic', () => {
  let token;
  let projectId;
  let queueId;

  beforeEach(async () => {
    // Register test user
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Worker User', email: 'worker@example.com', password: 'password123' });
    token = resAuth.body.data.token;

    // Create project
    const resProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Worker Project', description: 'desc' });
    projectId = resProject.body.data.id;

    // Create queue
    const resQueue = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'worker-queue', retry_policy: { strategy: 'fixed', max_attempts: 3, delay_seconds: 5 } });
    queueId = resQueue.body.data.id;

    // Register the worker module so it has an ID
    await worker.registerWorker();
  });

  it('should return a DIFFERENT job for each concurrent call to claimJob()', async () => {
    // Insert 2 jobs
    await request(app).post(`/api/queues/${queueId}/jobs`).set('Authorization', `Bearer ${token}`).send({ type: 'task1' });
    await request(app).post(`/api/queues/${queueId}/jobs`).set('Authorization', `Bearer ${token}`).send({ type: 'task2' });

    // Call claimJob concurrently
    const [claim1, claim2] = await Promise.all([
      worker.claimJob(),
      worker.claimJob()
    ]);

    expect(claim1).toBeDefined();
    expect(claim2).toBeDefined();
    expect(claim1.job.id).not.toBe(claim2.job.id);
  });

  it('should revert job status to queued with updated scheduled_at when failing below max_attempts', async () => {
    const res = await request(app).post(`/api/queues/${queueId}/jobs`).set('Authorization', `Bearer ${token}`).send({ type: 'retry-me' });
    const jobId = res.body.data.id;

    const claim = await worker.claimJob();
    expect(claim.job.id).toBe(jobId);

    // Force failure
    await worker.onJobFailure(claim.job, claim.executionId, 'simulated error');

    const jobRes = await db.query(`SELECT status, scheduled_at, attempt_count FROM jobs WHERE id = $1`, [jobId]);
    expect(jobRes.rows[0].status).toBe('queued');
    expect(jobRes.rows[0].scheduled_at).not.toBeNull();
    // attempt_count should be 1 because claimJob increments it, but let's just check status.
  });

  it('should set job status to failed and create a DLQ entry when failing at max_attempts', async () => {
    // Queue has max_attempts = 3
    const res = await request(app).post(`/api/queues/${queueId}/jobs`).set('Authorization', `Bearer ${token}`).send({ type: 'fail-me' });
    const jobId = res.body.data.id;

    // Manually set attempt_count to 3 to simulate final failure
    await db.query(`UPDATE jobs SET attempt_count = 3 WHERE id = $1`, [jobId]);

    const claim = await worker.claimJob();
    // The claimJob function increments attempt_count to 4 (which is > max_attempts 3).

    await worker.onJobFailure(claim.job, claim.executionId, 'fatal error');

    const jobRes = await db.query(`SELECT status FROM jobs WHERE id = $1`, [jobId]);
    expect(jobRes.rows[0].status).toBe('failed');

    const dlqRes = await db.query(`SELECT * FROM dead_letter_queue WHERE job_id = $1`, [jobId]);
    expect(dlqRes.rows.length).toBe(1);
    expect(dlqRes.rows[0].failure_reason).toBe('fatal error');
  });

  it('should recover jobs to queued status when worker heartbeat is older than 45 seconds', async () => {
    const res = await request(app).post(`/api/queues/${queueId}/jobs`).set('Authorization', `Bearer ${token}`).send({ type: 'orphan-me' });
    const jobId = res.body.data.id;

    // Create a fake dead worker
    const deadWorkerId = uuidv4();
    await db.query(`INSERT INTO workers (id, hostname, status) VALUES ($1, 'dead-node', 'busy')`, [deadWorkerId]);
    // Insert a heartbeat older than 45 seconds
    await db.query(`INSERT INTO worker_heartbeats (id, worker_id, beat_at) VALUES ($1, $2, NOW() - INTERVAL '60 seconds')`, [uuidv4(), deadWorkerId]);

    // Set job to running under this dead worker
    await db.query(`UPDATE jobs SET status = 'running' WHERE id = $1`, [jobId]);
    await db.query(`INSERT INTO job_executions (id, job_id, worker_id, status, attempt_number) VALUES ($1, $2, $3, 'running', 1)`, [uuidv4(), jobId, deadWorkerId]);

    // Run recovery
    await worker.recoverDeadWorkerJobs();

    const jobRes = await db.query(`SELECT status FROM jobs WHERE id = $1`, [jobId]);
    expect(jobRes.rows[0].status).toBe('queued');
  });
});
