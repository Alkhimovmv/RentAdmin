import apiClient from './client';
import { type FinancialSummary, type MonthlyRevenue, type EquipmentUtilization } from '../types/index';

export const analyticsApi = {
  getMonthlyRevenue: async (): Promise<MonthlyRevenue[]> => {
    const response = await apiClient.get('/analytics/monthly-revenue');
    return response.data;
  },

  getEquipmentUtilization: async (): Promise<EquipmentUtilization[]> => {
    const response = await apiClient.get('/analytics/equipment-utilization');
    return response.data;
  },

  getFinancialSummary: async (year?: number, month?: number): Promise<FinancialSummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await apiClient.get(`/analytics/financial-summary?${params.toString()}`);
    return response.data;
  },
};