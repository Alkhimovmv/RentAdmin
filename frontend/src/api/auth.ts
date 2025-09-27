import apiClient from './client';

export const authApi = {
  login: async (pinCode: string) => {
    const response = await apiClient.post('/auth/login', { pinCode });
    return response.data;
  },

  verify: async () => {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  },
};