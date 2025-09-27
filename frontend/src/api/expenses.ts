import apiClient from './client';
import { type Expense, type CreateExpenseDto } from '../types/index';

export const expensesApi = {
  getAll: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expenses');
    return response.data;
  },

  getById: async (id: number): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseDto): Promise<Expense> => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateExpenseDto>): Promise<Expense> => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};