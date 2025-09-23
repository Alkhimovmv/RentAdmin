import request from 'supertest';
import app from '../server';

describe('Analytics API', () => {
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
        name: 'Test Equipment for Analytics',
        quantity: 2,
        base_price: 1000
      });

    equipmentId = equipmentResponse.body.id;
  });

  describe('GET /api/analytics/monthly-revenue', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/monthly-revenue');

      expect(response.status).toBe(401);
    });

    it('should get monthly revenue data', async () => {
      const response = await request(app)
        .get('/api/analytics/monthly-revenue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return monthly revenue with correct structure', async () => {
      // Create some test data first
      await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          customer_name: 'Analytics Test Customer',
          customer_phone: '+7 555 123 4567',
          needs_delivery: true,
          delivery_address: 'Test Address',
          rental_price: 2000,
          delivery_price: 500,
          delivery_costs: 200,
          source: 'website' as any,
          comment: 'Analytics test'
        });

      const response = await request(app)
        .get('/api/analytics/monthly-revenue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const monthlyData = response.body[0];
        expect(monthlyData).toHaveProperty('year');
        expect(monthlyData).toHaveProperty('month');
        expect(monthlyData).toHaveProperty('month_name');
        expect(monthlyData).toHaveProperty('total_revenue');
        expect(monthlyData).toHaveProperty('rental_count');
        expect(typeof monthlyData.year).toBe('number');
        expect(typeof monthlyData.month).toBe('number');
        expect(typeof monthlyData.month_name).toBe('string');
        expect(typeof monthlyData.total_revenue).toBe('number');
        expect(typeof monthlyData.rental_count).toBe('number');
      }
    });

    it('should return data sorted by year and month descending', async () => {
      const response = await request(app)
        .get('/api/analytics/monthly-revenue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const current = response.body[i];
          const next = response.body[i + 1];

          // Should be sorted by year DESC, then month DESC
          if (current.year === next.year) {
            expect(current.month).toBeGreaterThanOrEqual(next.month);
          } else {
            expect(current.year).toBeGreaterThanOrEqual(next.year);
          }
        }
      }
    });
  });

  describe('GET /api/analytics/financial-summary', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/financial-summary');

      expect(response.status).toBe(401);
    });

    it('should get financial summary with year and month parameters', async () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });

    it('should return financial summary with correct structure', async () => {
      // Create test data for current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Create rental
      await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: equipmentId,
          start_date: now.toISOString(),
          end_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          customer_name: 'Financial Summary Test',
          customer_phone: '+7 777 888 9999',
          needs_delivery: true,
          delivery_address: 'Summary Test Address',
          rental_price: 3000,
          delivery_price: 800,
          delivery_costs: 300,
          source: 'avito' as any,
          comment: 'Financial test'
        });

      // Create expense
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test Expense for Analytics',
          amount: 1500,
          date: now.toISOString().split('T')[0],
          category: 'Тестовая'
        });

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const summary = response.body;
      expect(summary).toHaveProperty('total_revenue');
      expect(summary).toHaveProperty('rental_revenue');
      expect(summary).toHaveProperty('delivery_revenue');
      expect(summary).toHaveProperty('total_costs');
      expect(summary).toHaveProperty('delivery_costs');
      expect(summary).toHaveProperty('operational_expenses');
      expect(summary).toHaveProperty('net_profit');
      expect(summary).toHaveProperty('total_rentals');

      // Check data types
      expect(typeof summary.total_revenue).toBe('number');
      expect(typeof summary.rental_revenue).toBe('number');
      expect(typeof summary.delivery_revenue).toBe('number');
      expect(typeof summary.total_costs).toBe('number');
      expect(typeof summary.delivery_costs).toBe('number');
      expect(typeof summary.operational_expenses).toBe('number');
      expect(typeof summary.net_profit).toBe('number');
      expect(typeof summary.total_rentals).toBe('number');

      // Check logical relationships
      expect(summary.total_revenue).toBe(summary.rental_revenue + summary.delivery_revenue);
      expect(summary.total_costs).toBe(summary.delivery_costs + summary.operational_expenses);
      expect(summary.net_profit).toBe(summary.total_revenue - summary.total_costs);
    });

    it('should handle missing year or month parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/financial-summary')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either return 400 for missing params or use defaults
      expect([200, 400].includes(response.status)).toBe(true);
    });

    it('should handle invalid year or month parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/financial-summary?year=invalid&month=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400].includes(response.status)).toBe(true);
    });

    it('should return zero values for months with no data', async () => {
      // Use a future month that definitely has no data
      const futureYear = new Date().getFullYear() + 1;
      const month = 6;

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${futureYear}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const summary = response.body;
      expect(summary.total_revenue).toBe(0);
      expect(summary.rental_revenue).toBe(0);
      expect(summary.delivery_revenue).toBe(0);
      expect(summary.total_costs).toBe(0);
      expect(summary.delivery_costs).toBe(0);
      expect(summary.operational_expenses).toBe(0);
      expect(summary.net_profit).toBe(0);
      expect(summary.total_rentals).toBe(0);
    });
  });

  describe('Analytics calculations', () => {
    beforeEach(async () => {
      // Clean setup for each test by using specific date ranges or unique identifiers
    });

    it('should correctly calculate revenue from multiple rentals', async () => {
      const testDate = new Date();
      const year = testDate.getFullYear();
      const month = testDate.getMonth() + 1;

      // Create multiple rentals
      const rentals = [
        {
          rental_price: 1000,
          delivery_price: 200,
          delivery_costs: 100
        },
        {
          rental_price: 1500,
          delivery_price: 300,
          delivery_costs: 150
        }
      ];

      for (const rental of rentals) {
        await request(app)
          .post('/api/rentals')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            equipment_id: equipmentId,
            start_date: testDate.toISOString(),
            end_date: new Date(testDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            customer_name: `Multi Test Customer ${rental.rental_price}`,
            customer_phone: `+7 555 ${rental.rental_price}`,
            needs_delivery: true,
            delivery_address: 'Multi Test Address',
            rental_price: rental.rental_price,
            delivery_price: rental.delivery_price,
            delivery_costs: rental.delivery_costs,
            source: 'website' as any
          });
      }

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const summary = response.body;

      // Check that revenues include our test data
      expect(summary.rental_revenue).toBeGreaterThanOrEqual(2500); // 1000 + 1500
      expect(summary.delivery_revenue).toBeGreaterThanOrEqual(500); // 200 + 300
      expect(summary.delivery_costs).toBeGreaterThanOrEqual(250); // 100 + 150
      expect(summary.total_rentals).toBeGreaterThanOrEqual(2);
    });

    it('should correctly include expenses in operational costs', async () => {
      const testDate = new Date();
      const year = testDate.getFullYear();
      const month = testDate.getMonth() + 1;

      // Create test expenses
      const expenses = [500, 750, 1200];

      for (const amount of expenses) {
        await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: `Analytics Test Expense ${amount}`,
            amount,
            date: testDate.toISOString().split('T')[0],
            category: 'Аналитика'
          });
      }

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const summary = response.body;

      // Operational expenses should include our test expenses
      expect(summary.operational_expenses).toBeGreaterThanOrEqual(2450); // 500 + 750 + 1200
    });

    it('should handle edge cases in date filtering', async () => {
      const year = 2025;
      const month = 12;

      const response = await request(app)
        .get(`/api/analytics/financial-summary?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const summary = response.body;
      expect(summary).toHaveProperty('total_revenue');
      expect(summary).toHaveProperty('net_profit');
    });
  });
});