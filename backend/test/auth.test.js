const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - Autenticación NEXUM', () => {
  test('GET /api/users/profile debe rechazar acceso sin token', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Token no proporcionado');
  });

  test('POST /api/auth/recover-password rechaza cambios sin verificacion', async () => {
    const response = await request(app)
      .post('/api/auth/recover-password')
      .send({ email: 'victima@test.com', newPassword: 'atacante123' });

    expect(response.statusCode).toBe(503);
    expect(response.body.message).toBe(
      'La recuperacion de contrasena no esta disponible temporalmente'
    );
  });
});
