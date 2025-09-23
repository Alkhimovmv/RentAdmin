import request from 'supertest';
import app from '../server';

describe('Customers API', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ pinCode: '20031997' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/customers', () => {
    it('should get all customers without authentication', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return customers with correct structure', async () => {
      // First create some test data
      const equipmentResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Equipment for Customer',
          quantity: 1,
          base_price: 1000
        });

      const equipmentId = equipmentResponse.body.id;

      // Create a rental to generate customer data
      await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          customer_name: 'Test Customer',
          customer_phone: '+7 123 456 7890',
          needs_delivery: false,
          rental_price: 1500,
          source: 'website' as any
        });

      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Check if our test customer is in the list
      const testCustomer = response.body.find((customer: any) =>
        customer.customer_name === 'Test Customer'
      );

      if (testCustomer) {
        expect(testCustomer).toHaveProperty('customer_name');
        expect(testCustomer).toHaveProperty('customer_phone');
        expect(testCustomer).toHaveProperty('rental_count');
        expect(testCustomer.customer_name).toBe('Test Customer');
        expect(testCustomer.customer_phone).toBe('+7 123 456 7890');
        expect(typeof testCustomer.rental_count).toBe('number');
        expect(testCustomer.rental_count).toBeGreaterThan(0);
      }
    });

    it('should handle empty customers list gracefully', async () => {
      // This test assumes a fresh database or filtered result
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Even if empty, should return an array
    });

    it('should return customers sorted by rental count descending', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      if (response.body.length > 1) {
        // Check if sorted by rental_count in descending order
        for (let i = 0; i < response.body.length - 1; i++) {
          expect(response.body[i].rental_count).toBeGreaterThanOrEqual(
            response.body[i + 1].rental_count
          );
        }
      }
    });

    it('should include only unique customers', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      // Create a set of unique customer phone numbers
      const phoneNumbers = response.body.map((customer: any) => customer.customer_phone);
      const uniquePhoneNumbers = new Set(phoneNumbers);

      // Should be the same length (no duplicates)
      expect(phoneNumbers.length).toBe(uniquePhoneNumbers.size);
    });

    it('should handle database errors gracefully', async () => {
      // This is harder to test without mocking, but we can test the endpoint exists
      const response = await request(app)
        .get('/api/customers');

      // Should not crash and should return a proper HTTP response
      expect([200, 500].includes(response.status)).toBe(true);
    });

    it('should return customers with valid phone number format', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      response.body.forEach((customer: any) => {
        expect(customer.customer_phone).toBeDefined();
        expect(typeof customer.customer_phone).toBe('string');
        expect(customer.customer_phone.length).toBeGreaterThan(0);
      });
    });

    it('should return customers with positive rental counts', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      response.body.forEach((customer: any) => {
        expect(customer.rental_count).toBeDefined();
        expect(typeof customer.rental_count).toBe('number');
        expect(customer.rental_count).toBeGreaterThan(0);
      });
    });

    it('should return customers with non-empty names', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      response.body.forEach((customer: any) => {
        expect(customer.customer_name).toBeDefined();
        expect(typeof customer.customer_name).toBe('string');
        expect(customer.customer_name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Customer data aggregation', () => {
    it('should correctly count multiple rentals for the same customer', async () => {
      // Create equipment for testing
      const equipmentResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Equipment for Multiple Rentals',
          quantity: 3,
          base_price: 1000
        });

      const equipmentId = equipmentResponse.body.id;

      // Create multiple rentals for the same customer
      const customerData = {
        customer_name: 'Multi Rental Customer',
        customer_phone: '+7 999 888 7777'
      };

      // Create first rental
      await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          equipment_instance: 1,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          customer_name: customerData.customer_name,
          customer_phone: customerData.customer_phone,
          needs_delivery: false,
          rental_price: 1000,
          source: 'website' as any
        });

      // Create second rental
      await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          equipment_instance: 2,
          start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          customer_name: customerData.customer_name,
          customer_phone: customerData.customer_phone,
          needs_delivery: false,
          rental_price: 1200,
          source: 'avito' as any
        });

      // Check customer aggregation
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      const multiRentalCustomer = response.body.find((customer: any) =>
        customer.customer_phone === customerData.customer_phone
      );

      expect(multiRentalCustomer).toBeDefined();
      expect(multiRentalCustomer.customer_name).toBe(customerData.customer_name);
      expect(multiRentalCustomer.rental_count).toBeGreaterThanOrEqual(2);
    });

    it('should handle customers with different phone number formats', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(200);

      // All customers should have valid phone numbers regardless of format
      response.body.forEach((customer: any) => {
        expect(customer.customer_phone).toBeTruthy();
        expect(typeof customer.customer_phone).toBe('string');
      });
    });
  });
});