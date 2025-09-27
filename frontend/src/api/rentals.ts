import apiClient from './client';
import { type CreateRentalDto, type Rental } from '../types/index';

export const rentalsApi = {
  getAll: async (): Promise<Rental[]> => {
    const response = await apiClient.get('/rentals');
    return response.data;
  },

  getById: async (id: number): Promise<Rental> => {
    const response = await apiClient.get(`/rentals/${id}`);
    return response.data;
  },

  getGanttData: async (startDate?: string, endDate?: string): Promise<Rental[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/rentals/gantt?${params.toString()}`);
    return response.data;
  },

  create: async (data: CreateRentalDto): Promise<Rental> => {
    const response = await apiClient.post('/rentals', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateRentalDto & { status: string }>): Promise<Rental> => {
    const response = await apiClient.put(`/rentals/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rentals/${id}`);
  },
};