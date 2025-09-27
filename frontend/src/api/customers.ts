import apiClient from './client';
import { type Customer, type Rental } from '../types/index';

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get('/customers');
    return response.data;
  },

  getCustomerRentals: async (phone: string): Promise<Rental[]> => {
    const response = await apiClient.get(`/customers/${encodeURIComponent(phone)}/rentals`);
    return response.data;
  },
};