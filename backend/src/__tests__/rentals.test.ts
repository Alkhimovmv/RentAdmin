import request from 'supertest';
import app from '../server';

describe('Rentals API', () => {
  let authToken: string;
  let equipmentId: number;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ pinCode: '20031997' });

    authToken = loginResponse.body.token;

    // Create test equipment
    const equipmentResponse = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Equipment for Rentals',
        quantity: 5,
        base_price: 1000
      });

    equipmentId = equipmentResponse.body.id;
  });

  describe('GET /api/rentals', () => {
    it('should get all rentals', async () => {
      const response = await request(app)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/rentals', () => {
    it('should create new rental', async () => {
      const rentalData = {
        equipment_id: equipmentId,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customer_name: 'Test Customer',
        customer_phone: '+7 123 456-78-90',
        needs_delivery: true,
        delivery_address: 'Test Address',
        rental_price: 1500,
        delivery_price: 300,
        delivery_costs: 100,
        source: 'тест' as any,
        comment: 'Test rental'
      };

      const response = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rentalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.customer_name).toBe(rentalData.customer_name);
      expect(response.body.rental_price).toBe(rentalData.rental_price);
    });

    it('should reject invalid rental data', async () => {
      const response = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customer_name: 'Test' }); // Missing required fields

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/rentals/gantt', () => {
    it('should get gantt data', async () => {
      const response = await request(app)
        .get('/api/rentals/gantt')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter gantt data by date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/rentals/gantt?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/rentals/:id', () => {
    let rentalId: number;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          customer_name: 'Rental to Update',
          customer_phone: '+7 123 456-78-90',
          needs_delivery: false,
          rental_price: 1000,
          source: 'тест' as any
        });

      rentalId = createResponse.body.id;
    });

    it('should update rental', async () => {
      const updateData = {
        customer_name: 'Updated Customer',
        rental_price: 1500
      };

      const response = await request(app)
        .put(`/api/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.customer_name).toBe(updateData.customer_name);
      expect(response.body.rental_price).toBe(updateData.rental_price);
    });

    it('should update rental status', async () => {
      const response = await request(app)
        .put(`/api/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });
  });
});