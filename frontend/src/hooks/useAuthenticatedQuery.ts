import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

/**
 * Хук для выполнения запросов только после авторизации
 * Предотвращает API вызовы до успешной аутентификации
 */
export function useAuthenticatedQuery<T = any>(queryKey: any[], queryFn: any, options?: any) {
  const { isAuthenticated, isVerifying } = useAuth();

  return useQuery<T>(
    queryKey,
    queryFn,
    {
      // Выполнять запрос только если пользователь авторизован и не идет процесс проверки
      enabled: isAuthenticated && !isVerifying,
      ...options,
    }
  );
}