#!/usr/bin/env node

/**
 * Простой standalone API сервер для RentAdmin
 * Запуск БЕЗ Docker, БЕЗ базы данных - только для тестирования API
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS для Netlify
const corsOptions = {
  origin: [
    'https://vozmimenjaadmin.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    '*'  // Временно разрешить все для отладки
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Mock данные
const mockData = {
  equipment: [
    { id: 1, name: 'Дрель', category: 'Инструменты', status: 'available', price_per_day: 500 },
    { id: 2, name: 'Миксер', category: 'Техника', status: 'rented', price_per_day: 800 },
    { id: 3, name: 'Перфоратор', category: 'Инструменты', status: 'available', price_per_day: 700 }
  ],
  customers: [
    { id: 1, name: 'Иван Петров', email: 'ivan@test.com', phone: '+7900123456' },
    { id: 2, name: 'Мария Сидорова', email: 'maria@test.com', phone: '+7900654321' }
  ],
  rentals: [
    { id: 1, equipment_id: 2, customer_id: 1, start_date: '2024-01-15', end_date: '2024-01-20', status: 'active' }
  ]
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Simple Standalone Server',
    port: PORT,
    message: 'RentAdmin API работает!'
  });
});

// Корневой endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'RentAdmin Simple API Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      equipment: '/api/equipment',
      customers: '/api/customers',
      rentals: '/api/rentals'
    }
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Простая проверка
  if (email && password) {
    res.json({
      token: 'mock-jwt-token-' + Date.now(),
      user: { email, name: 'Test User' },
      message: 'Успешный вход (mock)'
    });
  } else {
    res.status(400).json({ error: 'Email и пароль обязательны' });
  }
});

app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;

  if (pin === '20031997') {
    res.json({
      token: 'mock-admin-token-' + Date.now(),
      message: 'PIN код верный (mock)'
    });
  } else {
    res.status(400).json({ error: 'Неверный PIN код' });
  }
});

// Equipment endpoints
app.get('/api/equipment', (req, res) => {
  res.json(mockData.equipment);
});

app.post('/api/equipment', (req, res) => {
  const newEquipment = {
    id: mockData.equipment.length + 1,
    ...req.body,
    status: 'available'
  };
  mockData.equipment.push(newEquipment);
  res.status(201).json(newEquipment);
});

// Customers endpoints
app.get('/api/customers', (req, res) => {
  res.json(mockData.customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer = {
    id: mockData.customers.length + 1,
    ...req.body
  };
  mockData.customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// Rentals endpoints
app.get('/api/rentals', (req, res) => {
  res.json(mockData.rentals);
});

app.post('/api/rentals', (req, res) => {
  const newRental = {
    id: mockData.rentals.length + 1,
    ...req.body,
    status: 'active'
  };
  mockData.rentals.push(newRental);
  res.status(201).json(newRental);
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  res.json({
    total_equipment: mockData.equipment.length,
    total_customers: mockData.customers.length,
    active_rentals: mockData.rentals.filter(r => r.status === 'active').length,
    revenue: 15000,
    equipment_by_status: {
      available: mockData.equipment.filter(e => e.status === 'available').length,
      rented: mockData.equipment.filter(e => e.status === 'rented').length
    }
  });
});

// Catch all для неизвестных routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint не найден',
    method: req.method,
    path: req.path,
    available_endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/verify-pin',
      'GET /api/equipment',
      'POST /api/equipment',
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/rentals',
      'POST /api/rentals',
      'GET /api/analytics'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 RentAdmin Simple API Server запущен!`);
  console.log(`📡 Порт: ${PORT}`);
  console.log(`🌐 Доступен на: http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Все endpoints: http://localhost:${PORT}/`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен SIGINT, завершение работы...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен SIGTERM, завершение работы...');
  process.exit(0);
});