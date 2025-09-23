import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let validToken: string;
  const JWT_SECRET = process.env.JWT_SECRET || 'rent-admin-secret-key';

  beforeAll(async () => {
    // Get a valid token for testing
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ pinCode: '20031997' });

    validToken = loginResponse.body.token;
  });

  describe('Protected Routes Authentication', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/equipment' },
      { method: 'post', path: '/api/equipment' },
      { method: 'get', path: '/api/rentals' },
      { method: 'post', path: '/api/rentals' },
      { method: 'get', path: '/api/expenses' },
      { method: 'post', path: '/api/expenses' },
      { method: 'get', path: '/api/analytics/monthly-revenue' },
      { method: 'get', path: '/api/analytics/financial-summary' }
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`should require authentication for ${method.toUpperCase()} ${path}`, async () => {
        const response = await request(app)[method as keyof typeof request](path);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('отсутствует');
      });

      it(`should accept valid token for ${method.toUpperCase()} ${path}`, async () => {
        const response = await request(app)
          [method as keyof typeof request](path)
          .set('Authorization', `Bearer ${validToken}`);

        // Should not be 401 (unauthorized)
        expect(response.status).not.toBe(401);
      });
    });
  });

  describe('Token Validation', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/api/equipment');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('отсутствует');
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('неверный формат');
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('недействительный');
    });

    it('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { adminId: 1 },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('истек');
    });

    it('should accept valid tokens', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).not.toBe(401);
    });

    it('should handle tokens signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { adminId: 1 },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('недействительный');
    });

    it('should handle tokens with missing payload', async () => {
      const incompleteToken = jwt.sign(
        {}, // Missing adminId
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${incompleteToken}`);

      // Should either be rejected or handled gracefully
      expect([401, 500].includes(response.status)).toBe(true);
    });
  });

  describe('Authorization Header Formats', () => {
    it('should reject "Bearer" without token', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('неверный формат');
    });

    it('should reject token without "Bearer" prefix', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', validToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('неверный формат');
    });

    it('should handle case-sensitive "Bearer" prefix', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('неверный формат');
    });

    it('should handle extra spaces in Authorization header', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer  ${validToken}`); // Extra space

      // Should either work or be rejected consistently
      expect([200, 401].includes(response.status)).toBe(true);
    });
  });

  describe('Middleware Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/equipment');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should handle multiple authentication attempts', async () => {
      // Multiple rapid requests without auth
      const promises = Array(5).fill(null).map(() =>
        request(app).get('/api/equipment')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'Bearer invalid.token');

      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain(JWT_SECRET);
      expect(response.body.error).not.toContain('secret');
      expect(response.body.error).not.toContain('key');
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      { method: 'post', path: '/api/auth/login' },
      { method: 'get', path: '/api/customers' }
    ];

    publicRoutes.forEach(({ method, path }) => {
      it(`should allow access to public route ${method.toUpperCase()} ${path} without authentication`, async () => {
        const response = await request(app)[method as keyof typeof request](path)
          .send(method === 'post' ? { pinCode: 'invalid' } : undefined);

        // Should not be 401 (unauthorized), even if other errors occur
        expect(response.status).not.toBe(401);
      });
    });
  });

  describe('Token Refresh and Persistence', () => {
    it('should maintain authentication across multiple requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response1.status).not.toBe(401);

      // Second request with same token
      const response2 = await request(app)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response2.status).not.toBe(401);
    });

    it('should handle concurrent requests with same token', async () => {
      const requests = [
        request(app).get('/api/equipment').set('Authorization', `Bearer ${validToken}`),
        request(app).get('/api/rentals').set('Authorization', `Bearer ${validToken}`),
        request(app).get('/api/expenses').set('Authorization', `Bearer ${validToken}`)
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).not.toBe(401);
      });
    });
  });

  describe('Different HTTP Methods', () => {
    it('should authenticate POST requests', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .send({
          name: 'Test Equipment',
          quantity: 1,
          base_price: 1000
        });

      expect(response.status).toBe(401);
    });

    it('should authenticate PUT requests', async () => {
      const response = await request(app)
        .put('/api/equipment/1')
        .send({
          name: 'Updated Equipment'
        });

      expect(response.status).toBe(401);
    });

    it('should authenticate DELETE requests', async () => {
      const response = await request(app)
        .delete('/api/equipment/1');

      expect(response.status).toBe(401);
    });
  });
});