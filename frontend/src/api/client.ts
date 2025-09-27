import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Список возможных API серверов в порядке приоритета
const API_SERVERS = process.env.NODE_ENV === 'development'
  ? [
      'http://localhost:3001/api',        // Локальная разработка
      'https://87.242.103.146/api',       // Резервный HTTPS сервер
    ]
  : [
      'https://87.242.103.146/api',       // Production - HTTPS подключение к backend
    ];

let currentApiUrl: string = import.meta.env.VITE_API_URL || API_SERVERS[0];

// Функция для проверки доступности API сервера
async function checkServerHealth(baseURL: string): Promise<boolean> {
  try {
    const response = await axios.get(`${baseURL}/health`, {
      timeout: 5000,
      withCredentials: false
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

// Функция для поиска рабочего API сервера
async function findWorkingServer(): Promise<string> {
  console.log('🔍 Поиск доступного API сервера...');

  for (const server of API_SERVERS) {
    console.log(`Проверяю ${server}...`);
    const isWorking = await checkServerHealth(server);
    if (isWorking) {
      console.log(`✅ Найден рабочий сервер: ${server}`);
      return server;
    }
  }

  console.warn('⚠️ Ни один сервер не доступен, использую первый по умолчанию');
  return API_SERVERS[0];
}

// Создание API клиента
function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });
}

// Инициализация API клиента
async function initializeApiClient(): Promise<AxiosInstance> {
  currentApiUrl = await findWorkingServer();
  const client = createApiClient(currentApiUrl);

  // Request interceptor для добавления токена
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor с автоматическим переключением серверов
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Если 401 - проблемы с авторизацией
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Если сервер недоступен - попробуем переключиться
      if (!error.response && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'TIMEOUT')) {
        console.log('❌ Сервер недоступен, ищем альтернативу...');

        // Ищем новый рабочий сервер
        const newServerUrl = await findWorkingServer();

        if (newServerUrl !== currentApiUrl) {
          console.log(`🔄 Переключаемся с ${currentApiUrl} на ${newServerUrl}`);
          currentApiUrl = newServerUrl;

          // Создаем новый клиент
          const newClient = createApiClient(newServerUrl);

          // Повторяем запрос с новым клиентом
          try {
            const retryConfig = { ...error.config };
            retryConfig.baseURL = newServerUrl;
            delete retryConfig._retry; // Избегаем бесконечных повторов

            const token = localStorage.getItem('authToken');
            if (token) {
              retryConfig.headers.Authorization = `Bearer ${token}`;
            }

            const response = await newClient.request(retryConfig);
            return response;
          } catch (retryError) {
            console.error('Повторный запрос также неудачен:', retryError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

// Экспортируем промис с API клиентом
export const apiClientPromise = initializeApiClient();

// Для обратной совместимости - ленивый API клиент
export const apiClient = new Proxy({} as AxiosInstance, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const client = await apiClientPromise;
      return (client as any)[prop](...args);
    };
  }
});

// Функция для получения текущего URL API
export const getCurrentApiUrl = (): string => currentApiUrl;

// Функция для принудительного переключения на конкретный сервер
export const switchToServer = async (serverUrl: string): Promise<void> => {
  const isWorking = await checkServerHealth(serverUrl);
  if (isWorking) {
    currentApiUrl = serverUrl;
    console.log(`Принудительно переключились на: ${serverUrl}`);
  } else {
    console.error(`Сервер ${serverUrl} недоступен`);
    throw new Error(`Server ${serverUrl} is not available`);
  }
};

export default apiClient;