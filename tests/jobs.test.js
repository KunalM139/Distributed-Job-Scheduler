const request = require('supertest');
const app = require('../backend/server');

describe('Jobs API Endpoints', () => {
  let token;
  let projectId;
  let queueId;

  beforeEach(async () => {
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jobs User', email: 'jobs@example.com', password: 'password123' });
    token = resAuth.body.data.token;

    const resProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project X', description: 'desc' });
    projectId = resProject.body.data.id;

    const resQueue = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'queue-x' });
    queueId = resQueue.body.data.id;
  });

  it('should return 201 and status queued for immediate job', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'immediate-task', payload: { a: 1 } });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('queued');
  });

  it('should return status scheduled for job with scheduled_at in the future', async () => {
    const futureDate = new Date(Date.now() + 100000).toISOString();
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'delayed-task', payload: { a: 1 }, scheduled_at: futureDate });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('scheduled');
  });

  it('should create a scheduled_job record when providing cron_expression', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'cron-task', cron_expression: '* * * * *' });

    expect(res.status).toBe(201);
    expect(res.body.data.cron_expression).toBe('* * * * *');
  });

  it('should create multiple jobs when providing a batch array', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send([
        { type: 'batch-task-1' },
        { type: 'batch-task-2' }
      ]);

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('should return only queued jobs when filtering by ?status=queued', async () => {
    await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'j1' });
    
    const futureDate = new Date(Date.now() + 100000).toISOString();
    await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'j2', scheduled_at: futureDate });

    const res = await request(app)
      .get(`/api/queues/${queueId}/jobs?status=queued`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].type).toBe('j1');
  });

  it('should return paginated response with correct shape when querying ?page=1&limit=5', async () => {
    const res = await request(app)
      .get(`/api/queues/${queueId}/jobs?page=1&limit=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
  });

  it('should reset job to queued and attempt_count to 0 when retrying a failed job', async () => {
    // 1. Create a job
    const createRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'fail-task' });
    const jobId = createRes.body.data.id;

    // 2. We can't easily simulate failing via API since workers do that, but we can update it in DB directly or test the endpoint assuming we can set it up. 
    // We will just call the endpoint. If the endpoint allows retrying any job, or if it must be failed... let's just make it failed in DB first.
    const db = require('../backend/src/db');
    await db.query(`UPDATE jobs SET status = 'failed', attempt_count = 3 WHERE id = $1`, [jobId]);

    // 3. Retry
    const res = await request(app)
      .post(`/api/jobs/${jobId}/retry`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.body.data.status).toBe('queued');
    expect(getRes.body.data.attempt_count).toBe(0);
  });

  it('should return 200 and job no longer exists when deleting a job', async () => {
    const createRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'delete-me' });
    const jobId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.status).toBe(404);
  });
});
