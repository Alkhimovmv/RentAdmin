import apiClient from './client';
import { type Equipment, type CreateEquipmentDto } from '../types/index';

export const equipmentApi = {
  getAll: async (): Promise<Equipment[]> => {
    const response = await apiClient.get('/equipment');
    return response.data;
  },

  getById: async (id: number): Promise<Equipment> => {
    const response = await apiClient.get(`/equipment/${id}`);
    return response.data;
  },

  create: async (data: CreateEquipmentDto): Promise<Equipment> => {
    const response = await apiClient.post('/equipment', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateEquipmentDto>): Promise<Equipment> => {
    const response = await apiClient.put(`/equipment/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/equipment/${id}`);
  },

  // Получить оборудование с виртуальными экземплярами для аренды
  getForRental: async (): Promise<Equipment[]> => {
    const response = await apiClient.get('/equipment/for-rental');
    return response.data;
  },
};