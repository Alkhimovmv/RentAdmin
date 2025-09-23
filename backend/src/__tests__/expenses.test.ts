import request from 'supertest';
import app from '../server';

describe('Expenses API', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ pinCode: '20031997' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/expenses', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/expenses');

      expect(response.status).toBe(401);
    });

    it('should get all expenses with valid token', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return expenses with correct structure', async () => {
      // First create a test expense
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test Expense',
          amount: 1500.50,
          date: '2024-01-15',
          category: 'Топливо'
        });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const testExpense = response.body.find((expense: any) =>
        expense.description === 'Test Expense'
      );

      if (testExpense) {
        expect(testExpense).toHaveProperty('id');
        expect(testExpense).toHaveProperty('description');
        expect(testExpense).toHaveProperty('amount');
        expect(testExpense).toHaveProperty('date');
        expect(testExpense).toHaveProperty('category');
        expect(testExpense.description).toBe('Test Expense');
        expect(testExpense.amount).toBe(1500.50);
        expect(testExpense.category).toBe('Топливо');
      }
    });
  });

  describe('POST /api/expenses', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Test Expense',
          amount: 1000,
          date: '2024-01-15'
        });

      expect(response.status).toBe(401);
    });

    it('should create new expense with valid data', async () => {
      const expenseData = {
        description: 'Бензин для доставки',
        amount: 2500,
        date: '2024-01-15',
        category: 'Топливо'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe(expenseData.description);
      expect(response.body.amount).toBe(expenseData.amount);
      expect(response.body.category).toBe(expenseData.category);
    });

    it('should create expense without category', async () => {
      const expenseData = {
        description: 'Расход без категории',
        amount: 500,
        date: '2024-01-16'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe(expenseData.description);
      expect(response.body.amount).toBe(expenseData.amount);
      expect(response.body.category).toBeNull();
    });

    it('should reject invalid expense data', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Incomplete data' }); // Missing required fields

      expect(response.status).toBe(500);
    });

    it('should handle decimal amounts correctly', async () => {
      const expenseData = {
        description: 'Точная сумма',
        amount: 1234.56,
        date: '2024-01-17',
        category: 'Тестовая'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(1234.56);
    });

    it('should handle negative amounts', async () => {
      const expenseData = {
        description: 'Возврат средств',
        amount: -500,
        date: '2024-01-18',
        category: 'Возврат'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(-500);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    let expenseId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Expense to Update',
          amount: 1000,
          date: '2024-01-19',
          category: 'Начальная'
        });

      expenseId = createResponse.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .send({
          description: 'Updated Expense',
          amount: 1500
        });

      expect(response.status).toBe(401);
    });

    it('should update expense with valid data', async () => {
      const updateData = {
        description: 'Updated Expense Description',
        amount: 1500,
        category: 'Обновленная категория'
      };

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.amount).toBe(updateData.amount);
      expect(response.body.category).toBe(updateData.category);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        amount: 2000
      };

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe(updateData.amount);
      expect(response.body.description).toBe('Expense to Update'); // Should remain unchanged
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated Description'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    let expenseId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Expense to Delete',
          amount: 1000,
          date: '2024-01-20',
          category: 'Удаляемая'
        });

      expenseId = createResponse.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`);

      expect(response.status).toBe(401);
    });

    it('should delete expense successfully', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify expense is deleted
      const getResponse = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedExpense = getResponse.body.find((expense: any) => expense.id === expenseId);
      expect(deletedExpense).toBeUndefined();
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle deletion of already deleted expense', async () => {
      // Delete the expense first
      await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Expense data validation', () => {
    it('should handle various category types', async () => {
      const categories = ['Топливо', 'Ремонт оборудования', 'Реклама', 'Прочее', null];

      for (const category of categories) {
        const expenseData = {
          description: `Expense with category: ${category || 'none'}`,
          amount: 100,
          date: '2024-01-21',
          ...(category && { category })
        };

        const response = await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .send(expenseData);

        expect(response.status).toBe(201);
        if (category) {
          expect(response.body.category).toBe(category);
        } else {
          expect(response.body.category).toBeNull();
        }
      }
    });

    it('should handle edge case amounts', async () => {
      const amounts = [0, 0.01, 999999.99];

      for (const amount of amounts) {
        const expenseData = {
          description: `Expense with amount: ${amount}`,
          amount,
          date: '2024-01-22'
        };

        const response = await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .send(expenseData);

        expect(response.status).toBe(201);
        expect(response.body.amount).toBe(amount);
      }
    });

    it('should handle long descriptions', async () => {
      const longDescription = 'A'.repeat(500); // Very long description

      const expenseData = {
        description: longDescription,
        amount: 100,
        date: '2024-01-23'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(longDescription);
    });
  });
});