const request = require('supertest');
const app = require('../backend/server');

describe('Queues API Endpoints', () => {
  let token;
  let projectId;

  beforeEach(async () => {
    // 1. Create a user and get token
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Queue User', email: 'queue@example.com', password: 'password123' });
    token = resAuth.body.data.token;

    // 2. Create a project
    const resProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'desc' });
    projectId = resProject.body.data.id;
  });

  it('should return 201 with queue object when creating a queue with valid data', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'test-queue',
        priority: 5,
        concurrency_limit: 10,
        retry_policy: { strategy: 'fixed', max_attempts: 3, delay_seconds: 5 }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('test-queue');
  });

  it('should return list of queues for a project', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'q1' });

    const res = await request(app)
      .get(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('q1');
  });

  it('should change queue status to paused when pausing', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'q2' });
    const queueId = createRes.body.data.id;

    const res = await request(app)
      .post(`/api/queues/${queueId}/pause`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    // verify
    const getRes = await request(app)
      .get(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.body.data[0].status).toBe('paused');
  });

  it('should change queue status to active when resuming', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'q3' });
    const queueId = createRes.body.data.id;

    await request(app).post(`/api/queues/${queueId}/pause`).set('Authorization', `Bearer ${token}`);
    
    const res = await request(app)
      .post(`/api/queues/${queueId}/resume`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    // verify
    const getRes = await request(app)
      .get(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.body.data[0].status).toBe('active');
  });

  it('should return job counts by status for queue stats', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/queues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'q4' });
    const queueId = createRes.body.data.id;

    // insert a job so we have stats
    await request(app)
      .post(`/api/queues/${queueId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'task', payload: {} });

    const res = await request(app)
      .get(`/api/queues/${queueId}/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.queued).toBe('1');
  });
});
