const request = require('supertest');
const app = require('../server');

describe('Projects API Endpoints', () => {
  let token;
  let projectId;

  beforeEach(async () => {
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Project User', email: 'project@example.com', password: 'password123' });
    token = resAuth.body.token;
  });

  it('should return 201 and project data when creating a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Test Project');
    expect(res.body.data.description).toBe('A test project');
    projectId = res.body.data.id;
  });

  it('should list projects for the authenticated user', async () => {
    // Create a project first
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project 1' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe('Project 1');
  });

  it('should delete a project owned by the user', async () => {
    // Create a project first
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });
    const idToDelete = createRes.body.data.id;

    // Delete it
    const delRes = await request(app)
      .delete(`/api/projects/${idToDelete}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toBe('Project deleted');
    
    // Verify it's gone
    const listRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.length).toBe(0);
  });

  it('should return 404 when trying to delete a non-existent project', async () => {
    const res = await request(app)
      .delete('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe(true);
    expect(res.body.message).toBe('Project not found or not owned by you');
  });

  it('should return 401 when accessing projects without token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
