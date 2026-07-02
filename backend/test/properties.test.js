const request = require('supertest');
const app = require('../src/app');

describe('Prueba de integración - Propiedades NEXUM', () => {
  test('GET /api/properties/nearby debe rechazar parámetros inválidos', async () => {
    const response = await request(app).get('/api/properties/nearby?lat=abc&lng=def&radius=xyz');

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Parámetros inválidos. Usa lat, lng y radius numéricos');
  });
});