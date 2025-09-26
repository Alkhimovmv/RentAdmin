const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Порты
const FRONTEND_PORT = 8443;
const BACKEND_URL = 'http://127.0.0.1:3001';

// SSL сертификаты
const sslPath = path.join(process.env.HOME, 'rentadmin-deploy', 'ssl');
const sslOptions = {
  key: fs.readFileSync(path.join(sslPath, 'key.pem')),
  cert: fs.readFileSync(path.join(sslPath, 'cert.pem'))
};

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// API proxy
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log('🔴 Backend недоступен:', err.message);
    res.status(500).json({
      error: 'Backend недоступен',
      message: `Убедитесь что backend запущен на ${BACKEND_URL}`,
      command: 'cd backend && npm run db:migrate && npm start'
    });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'RentAdmin Frontend',
    port: FRONTEND_PORT,
    backend: BACKEND_URL,
    timestamp: new Date().toISOString(),
    ssl: true
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'RentAdmin',
    frontend: `https://87.242.103.146:${FRONTEND_PORT}/`,
    api: `https://87.242.103.146:${FRONTEND_PORT}/api/`,
    backend: BACKEND_URL,
    ssl: true,
    instructions: {
      access: 'Откройте https://87.242.103.146:8443/ в браузере',
      ssl_warning: 'Нажмите "Дополнительно" → "Перейти на сайт (небезопасно)"',
      backend_start: 'cd backend && npm run db:migrate && npm start'
    }
  });
});

// Статические файлы фронтенда
const frontendPath = path.join(process.env.HOME, 'rentadmin-deploy', 'www');
app.use(express.static(frontendPath));

// SPA fallback - все остальные запросы направляем на index.html
app.use((req, res, next) => {
  // Если файл не найден и это не API запрос, отдаем index.html
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health') && !req.path.startsWith('/info')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

// Запуск HTTPS сервера
https.createServer(sslOptions, app).listen(FRONTEND_PORT, '0.0.0.0', () => {
  console.log('🎉 RentAdmin Frontend запущен!');
  console.log('');
  console.log('🌐 ДОСТУП К ПРИЛОЖЕНИЮ:');
  console.log(`Frontend: https://87.242.103.146:${FRONTEND_PORT}/`);
  console.log(`API: https://87.242.103.146:${FRONTEND_PORT}/api/`);
  console.log(`Info: https://87.242.103.146:${FRONTEND_PORT}/info`);
  console.log(`Health: https://87.242.103.146:${FRONTEND_PORT}/health`);
  console.log('');
  console.log('⚠️ ВАЖНО:');
  console.log('1. Запустите backend: cd backend && npm run db:migrate && npm start');
  console.log('2. При первом заходе примите SSL сертификат в браузере');
  console.log('');
  console.log('⏹️ Остановка: Ctrl+C');
});

// Обработка ошибок
process.on('EADDRINUSE', () => {
  console.log(`❌ Порт ${FRONTEND_PORT} уже используется`);
  console.log(`Остановите другие процессы: lsof -ti:${FRONTEND_PORT} | xargs kill`);
});

process.on('uncaughtException', (err) => {
  console.log('❌ Ошибка:', err.message);
  if (err.code === 'ENOENT' && err.path.includes('ssl')) {
    console.log('💡 Сначала запустите: ./scripts/simple-deploy.sh');
  }
});

console.log(`🚀 Запуск RentAdmin Frontend на порту ${FRONTEND_PORT}...`);
console.log(`📁 Статические файлы: ${frontendPath}`);
console.log(`🔗 Проксирование API: /api/* → ${BACKEND_URL}`);
console.log('');