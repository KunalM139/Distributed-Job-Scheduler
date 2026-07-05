const request = require('supertest');
const app = require('../server');
const db = require('../src/db');
const worker = require('../src/workers/worker');

describe('Worker API and Logic', () => {
  let token;

  beforeEach(async () => {
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Worker User', email: 'worker@example.com', password: 'password123' });
    token = resAuth.body.token;
  });

  describe('Worker API Endpoints', () => {
    it('should list registered workers', async () => {
      await worker.registerWorker();

      const res = await request(app)
        .get('/api/workers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].status).toBe('idle');
      expect(res.body.data[0].hostname).toBeDefined();
    });

    it('should get a specific worker and its current jobs', async () => {
      await worker.registerWorker();
      const workerId = worker.getWorkerId();

      const res = await request(app)
        .get(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(workerId);
      expect(Array.isArray(res.body.data.current_jobs)).toBe(true);
    });

    it('should return 404 for a non-existent worker', async () => {
      const res = await request(app)
        .get('/api/workers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('Worker Internal Logic', () => {
    let queueId;

    beforeEach(async () => {
      const pRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Worker Project' });
      const projectId = pRes.body.data.id;

      const qRes = await request(app)
        .post(`/api/projects/${projectId}/queues`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'worker-queue', priority: 1, concurrency_limit: 5 });
      queueId = qRes.body.data.id;

      await worker.registerWorker();
    });

    it('should claim a queued job successfully', async () => {
      await request(app)
        .post(`/api/queues/${queueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'claimable', payload: {} });

      const result = await worker.claimJob();
      expect(result).not.toBeNull();
      const { job } = result;
      expect(job).toBeDefined();
      expect(job.type).toBe('claimable');
      
      const dbRes = await db.query('SELECT status FROM jobs WHERE id = $1', [job.id]);
      expect(dbRes.rows[0].status).toBe('running');
    });

    it('should handle job success correctly', async () => {
      await request(app)
        .post(`/api/queues/${queueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'success_job' });

      const result = await worker.claimJob();
      expect(result).not.toBeNull();
      const { job, executionId } = result;

      await worker.onJobSuccess(job, executionId);

      const dbRes = await db.query('SELECT status FROM jobs WHERE id = $1', [job.id]);
      expect(dbRes.rows[0].status).toBe('completed');
    });

    it('should handle job failure and retry it if max attempts not reached', async () => {
      await request(app)
        .post(`/api/queues/${queueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'fail_retry_job' });

      const result = await worker.claimJob();
      expect(result).not.toBeNull();
      const { job, executionId } = result;
      
      await worker.onJobFailure(job, executionId, 'Simulated failure');

      const dbRes = await db.query('SELECT status, attempt_count FROM jobs WHERE id = $1', [job.id]);
      expect(dbRes.rows[0].status).toBe('queued');
      expect(dbRes.rows[0].attempt_count).toBe(1);
    });
  });
});
