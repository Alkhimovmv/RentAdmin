import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const isAuthenticated = Boolean(token);

  // Синхронизируем состояние с localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('authToken'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginMutation = useMutation(authApi.login, {
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      window.location.reload(); // Перезагрузить страницу после успешного входа
    },
    onError: () => {
      localStorage.removeItem('authToken');
      setToken(null);
    },
  });

  const verifyQuery = useQuery(['auth', 'verify'], authApi.verify, {
    enabled: isAuthenticated,
    retry: false,
    onError: (error: any) => {
      // При ошибке аутентификации очищаем токен
      if (error?.response?.status === 401) {
        localStorage.removeItem('authToken');
        setToken(null);
      }
    },
  });

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    window.location.href = '/login';
  };

  // Если нет токена, то не проверяем - пользователь точно не аутентифицирован
  const isVerifying = isAuthenticated ? verifyQuery.isLoading : false;

  return {
    isAuthenticated,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    loginLoading: loginMutation.isLoading,
    logout,
    user: verifyQuery.data,
    isVerifying,
  };
};