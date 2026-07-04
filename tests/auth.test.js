const request = require('supertest');
const app = require('../backend/server');
const db = require('../backend/src/db');

describe('Auth API Endpoints', () => {
  it('should return 201 and a JWT token when registering with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should return 409 error when registering with duplicate email', async () => {
    // Register first user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123'
      });

    // Try again
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 validation error when registering with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Email User'
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 200 and token when logging in with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'password123'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should return 401 when logging in with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Wrong Pass',
        email: 'wrong@example.com',
        password: 'password123'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('should return 401 when accessing protected route without token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
