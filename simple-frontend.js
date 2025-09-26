const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  next();
});

// Простой health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'RentAdmin Frontend',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'RentAdmin Frontend (Simple HTTP)',
    url: `http://87.242.103.146:${PORT}/`,
    api: 'Backend должен работать на порту 3001',
    note: 'Простая версия без HTTPS для быстрого тестирования'
  });
});

// Проксирование API (простое)
app.use('/api', (req, res) => {
  res.status(503).json({
    error: 'Backend не подключен',
    message: 'Запустите backend: cd backend && npm run db:migrate && npm start',
    note: 'После запуска backend перезапустите этот сервер'
  });
});

// Статические файлы
const frontendPath = path.join(process.env.HOME, 'rentadmin-deploy', 'www');
app.use(express.static(frontendPath));

// SPA fallback
app.use((req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <h1>Фронтенд не найден</h1>
        <p>Сначала запустите: ./scripts/simple-deploy.sh</p>
        <p>Ищем файлы в: ${frontendPath}</p>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Простой RentAdmin Frontend запущен!');
  console.log('');
  console.log('🌐 ДОСТУП:');
  console.log(`Frontend: http://87.242.103.146:${PORT}/`);
  console.log(`Health: http://87.242.103.146:${PORT}/health`);
  console.log(`Info: http://87.242.103.146:${PORT}/info`);
  console.log('');
  console.log('📁 Статические файлы:', frontendPath);
  console.log('⏹️ Остановка: Ctrl+C');
});

console.log(`🚀 Запуск на порту ${PORT}...`);