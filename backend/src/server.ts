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
// CORS Configuration for development and production
const corsOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CORS_ORIGIN || 'https://your-netlify-domain.netlify.app']
  : ['http://localhost:5173', 'http://localhost:3000', 'https://your-netlify-domain.netlify.app'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    environment: process.env.NODE_ENV
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Сервер запущен на порту ${PORT}`);
  });
}

export default app;