import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { config } from 'dotenv';

import authRoutes from '@/routes/auth';
import equipmentRoutes from '@/routes/equipment';
import rentalRoutes from '@/routes/rentals';
import customerRoutes from '@/routes/customers';
import expenseRoutes from '@/routes/expenses';
import analyticsRoutes from '@/routes/analytics';

config();

const app = express();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty'
  } : undefined
});

const PORT = process.env.PORT || 3001;

app.use(helmet());

// CORS Configuration - поддержка разработки и продакшена
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const allowedOrigins = (process.env.NODE_ENV === 'development'
  ? [corsOrigin, 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5173', 'http://localhost:3000', 'http://87.242.103.146']
  : [corsOrigin, 'http://87.242.103.146', 'http://localhost', 'https://vozmimenya.ru', 'http://vozmimenya.ru']
).filter((origin): origin is string => origin !== undefined);

logger.info(`CORS origins: ${JSON.stringify(allowedOrigins)}`);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Поддержка старых браузеров
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'handled by backend',
    origin: process.env.CORS_ORIGIN?.trim()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((error: any, req: any, res: any, next: any) => {
  logger.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Сервер запущен на порту ${PORT}`);
    logger.info('CORS обрабатывается в nginx');
  });
}

export default app;