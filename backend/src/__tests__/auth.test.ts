import request from 'supertest';
import app from '../server';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with correct pin code', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ pinCode: '20031997' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid pin code', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ pinCode: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing pin code', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ pinCode: '20031997' });

      authToken = loginResponse.body.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', true);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});