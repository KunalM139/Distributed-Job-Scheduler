const request = require('supertest');
const app = require('../server');
const db = require('../src/db');
const { v4: uuidv4 } = require('uuid');

describe('DLQ API Endpoints', () => {
  let token;
  let queueId;

  beforeEach(async () => {
    // 1. Register User
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'DLQ User', email: 'dlq@example.com', password: 'password123' });
    token = resAuth.body.token;

    // 2. Create Project
    const pRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'DLQ Project' });
    const projectId = pRes.body.data.id;

    // 3. Create Queue
    const qRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dlq-queue', priority: 1, concurrency_limit: 5 });
    queueId = qRes.body.data.id;
  });

  it('should list dead letter queue entries', async () => {
    // Create a job and force it into DLQ manually
    const jobRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'dlq_test_job' });
    const jobId = jobRes.body.data.id;

    await db.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
    await db.query(
      'INSERT INTO dead_letter_queue (id, job_id, queue_id, total_attempts) VALUES ($1, $2, $3, $4)',
      [uuidv4(), jobId, queueId, 3]
    );

    const res = await request(app)
      .get('/api/dlq')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].job_id).toBe(jobId);
  });

  it('should requeue a DLQ job successfully', async () => {
    // Create a job and force it into DLQ
    const jobRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'dlq_retry_job' });
    const jobId = jobRes.body.data.id;

    await db.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
    const dlqId = uuidv4();
    await db.query(
      'INSERT INTO dead_letter_queue (id, job_id, queue_id, total_attempts) VALUES ($1, $2, $3, $4)',
      [dlqId, jobId, queueId, 3]
    );

    const res = await request(app)
      .post(`/api/dlq/${dlqId}/retry`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Job moved back to queued from dead-letter queue');

    // Check that job is queued again
    const jobCheck = await db.query('SELECT status FROM jobs WHERE id = $1', [jobId]);
    expect(jobCheck.rows[0].status).toBe('queued');

    // Check that DLQ entry is deleted
    const dlqCheck = await db.query('SELECT id FROM dead_letter_queue WHERE id = $1', [dlqId]);
    expect(dlqCheck.rows.length).toBe(0);
  });

  it('should return 404 if DLQ entry not found', async () => {
    const res = await request(app)
      .post('/api/dlq/00000000-0000-0000-0000-000000000000/retry')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(404);
  });
});
