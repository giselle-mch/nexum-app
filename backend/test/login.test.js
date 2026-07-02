const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - Login NEXUM', () => {
  test('POST /api/auth/login debe rechazar login sin datos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect([400, 500]).toContain(response.statusCode);
    expect(response.body).toHaveProperty('message');
  });
});