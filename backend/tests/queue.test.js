const request = require('supertest');
const app = require('../server');

describe('Queues API Endpoints', () => {
  let token;
  let projectId;
  let queueId;

  beforeEach(async () => {
    // 1. Register User
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Queue User', email: 'queue@example.com', password: 'password123' });
    token = resAuth.body.token;

    // 2. Create Project
    const resProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Queue Project' });
    projectId = resProject.body.data.id;
  });

  it('should return 201 with queue object when creating a queue', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'test-queue',
        priority: 10,
        concurrency_limit: 5,
        retry_policy: {
          strategy: 'fixed',
          max_attempts: 3,
          delay_seconds: 5,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('test-queue');
    queueId = res.body.data.id;
  });

  it('should return list of queues for a project', async () => {
    // Create queue first
    await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'queue-1' });

    const res = await request(app)
      .get(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('queue-1');
  });

  it('should change queue status to paused when pausing', async () => {
    const qRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'queue-to-pause' });
    const id = qRes.body.data.id;

    const res = await request(app)
      .post(`/api/queues/${id}/pause`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Queue paused');
    expect(res.body.data.status).toBe('paused');
  });

  it('should change queue status to active when resuming', async () => {
    const qRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'queue-to-resume' });
    const id = qRes.body.data.id;

    await request(app).post(`/api/queues/${id}/pause`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/queues/${id}/resume`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Queue resumed');
    expect(res.body.data.status).toBe('active');
  });

  it('should return job counts by status for queue stats', async () => {
    const qRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'queue-stats' });
    const id = qRes.body.data.id;

    // Create a job so stats are populated
    await request(app)
      .post(`/api/queues/${id}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'stat-job' });

    const res = await request(app)
      .get(`/api/queues/${id}/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats).toHaveProperty('queued');
    expect(res.body.data.stats.queued).toBe(1);
  });
});
