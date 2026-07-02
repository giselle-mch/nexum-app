const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - API NEXUM', () => {
  test('GET /health debe responder con status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});