const request = require('supertest');
const app = require('../server');
const db = require('../src/db');

describe('Jobs API Endpoints', () => {
  let token;
  let projectId;
  let queueId;

  beforeEach(async () => {
    // 1. Register User
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Job User', email: 'job@example.com', password: 'password123' });
    token = resAuth.body.token;

    // 2. Create Project
    const resProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Job Project' });
    projectId = resProject.body.data.id;

    // 3. Create Queue
    const resQueue = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'job-queue', priority: 1, concurrency_limit: 5 });
    queueId = resQueue.body.data.id;
  });

  it('should return 201 with job object when creating a single job', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'email_job', payload: { to: 'test@example.com' } });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.type).toBe('email_job');
    expect(res.body.data.status).toBe('queued');
  });

  it('should return 201 with array of jobs when submitting a batch', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        batch: [
          { type: 'batch_job_1', payload: { idx: 1 } },
          { type: 'batch_job_2', payload: { idx: 2 } },
        ],
      });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.count).toBe(2);
  });

  it('should return 201 when creating a cron scheduled job', async () => {
    const res = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'cron_job', cron_expression: '*/5 * * * *' });

    expect(res.status).toBe(201);
    expect(res.body.scheduled).toBe(true);
    expect(res.body.data.cron_expression).toBe('*/5 * * * *');
  });

  it('should return list of jobs for a given queue', async () => {
    await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'list_job' });

    const res = await request(app)
      .get(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].type).toBe('list_job');
  });

  it('should change job status to queued when retrying a job', async () => {
    const jobRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'retry_job' });
    const jobId = jobRes.body.data.id;

    // Manually force it to failed via DB so we can test retry
    await db.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);

    const res = await request(app)
      .post(`/api/jobs/${jobId}/retry`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Job re-queued for retry');
    expect(res.body.data.status).toBe('queued');
  });

  it('should return 200 when deleting a job', async () => {
    const jobRes = await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'del_job' });
    const jobId = jobRes.body.data.id;

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Job deleted');
  });
});
