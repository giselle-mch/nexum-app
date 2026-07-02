const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - Autenticación NEXUM', () => {
  test('GET /api/users/profile debe rechazar acceso sin token', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Token no proporcionado');
  });
});