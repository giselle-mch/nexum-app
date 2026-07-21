const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - Autenticación NEXUM', () => {
  test('GET /api/auth/user-profile debe rechazar acceso sin token', async () => {
    const response = await request(app).get('/api/auth/user-profile');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Token no proporcionado');
  });

  test('GET /api/auth/user-profile debe mostrar correctamente Token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/user-profile')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Token inválido');
  });
});
