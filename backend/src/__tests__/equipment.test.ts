import request from 'supertest';
import app from '../server';

describe('Equipment API', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ pinCode: '20031997' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/equipment', () => {
    it('should get all equipment', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/equipment');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/equipment', () => {
    it('should create new equipment', async () => {
      const equipmentData = {
        name: 'Test Camera',
        quantity: 2,
        description: 'Test camera for testing',
        base_price: 1000
      };

      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(equipmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(equipmentData.name);
      expect(response.body.quantity).toBe(equipmentData.quantity);
    });

    it('should reject invalid equipment data', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Missing required fields

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/equipment/:id', () => {
    let equipmentId: number;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Equipment to Update',
          quantity: 1,
          base_price: 500
        });

      equipmentId = createResponse.body.id;
    });

    it('should update equipment', async () => {
      const updateData = {
        name: 'Updated Equipment',
        quantity: 3
      };

      const response = await request(app)
        .put(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.quantity).toBe(updateData.quantity);
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .put('/api/equipment/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    let equipmentId: number;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Equipment to Delete',
          quantity: 1,
          base_price: 500
        });

      equipmentId = createResponse.body.id;
    });

    it('should delete equipment', async () => {
      const response = await request(app)
        .delete(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .delete('/api/equipment/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});