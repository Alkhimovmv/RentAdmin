const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Получаем локальный IP
const os = require('os');
const interfaces = os.networkInterfaces();
let localIP = '127.0.0.1';

// Находим основной сетевой интерфейс
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
      localIP = iface.address;
      break;
    }
  }
}

// CORS для всех доменов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  next();
});

// Info endpoint с динамическими URL
app.get('/info', (req, res) => {
  res.json({
    service: 'RentAdmin - Локальный сервер',
    localIP: localIP,
    port: PORT,
    access: {
      local: `http://localhost:${PORT}/`,
      network: `http://${localIP}:${PORT}/`,
      mobile: `http://${localIP}:${PORT}/`
    },
    instructions: {
      desktop: `Откройте http://${localIP}:${PORT}/ в браузере`,
      mobile: `В том же WiFi откройте http://${localIP}:${PORT}/`,
      other_devices: `Подключитесь к WiFi сети и откройте http://${localIP}:${PORT}/`
    },
    backend_status: 'Запустите backend: cd backend && npm start',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'RentAdmin Frontend',
    localIP: localIP,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Простой API mock для демо
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'RentAdmin API работает!',
    server: 'Local Development',
    ip: localIP,
    timestamp: new Date().toISOString(),
    demo_data: {
      tenants: 5,
      properties: 3,
      payments: 12
    }
  });
});

// API endpoints заглушки
app.use('/api', (req, res) => {
  res.status(503).json({
    error: 'Backend не запущен',
    message: 'Для полной функциональности запустите backend',
    command: 'cd backend && npm install && npm run db:migrate && npm start',
    demo_endpoint: `http://${localIP}:${PORT}/api/demo`,
    note: 'Фронтенд работает в демо режиме'
  });
});

// Статические файлы фронтенда
const frontendPath = path.join(process.env.HOME, 'rentadmin-deploy', 'www');
app.use(express.static(frontendPath));

// SPA fallback
app.use((req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>RentAdmin - Настройка</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                .status { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .command { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; font-family: monospace; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
                .info { background: #e2f3ff; border: 1px solid #bee5eb; color: #0c5460; }
                ul { padding-left: 20px; }
                li { margin: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏠 RentAdmin - Локальный сервер</h1>

                <div class="info">
                    <h3>📍 Доступ к серверу:</h3>
                    <ul>
                        <li><strong>Локально:</strong> <a href="http://localhost:${PORT}/">http://localhost:${PORT}/</a></li>
                        <li><strong>Из сети:</strong> <a href="http://${localIP}:${PORT}/">http://${localIP}:${PORT}/</a></li>
                        <li><strong>С телефона:</strong> http://${localIP}:${PORT}/</li>
                    </ul>
                </div>

                <div class="status">
                    <h3>⚠️ Фронтенд не подготовлен</h3>
                    <p>Для работы интерфейса выполните:</p>
                    <div class="command">./scripts/simple-deploy.sh</div>
                </div>

                <div class="info">
                    <h3>🔧 Быстрый старт:</h3>
                    <ol>
                        <li>Подготовить фронтенд: <code>./scripts/simple-deploy.sh</code></li>
                        <li>Перезапустить сервер: <code>./local-start.sh</code></li>
                        <li>Открыть <a href="http://${localIP}:${PORT}/">http://${localIP}:${PORT}/</a></li>
                    </ol>
                </div>

                <div class="info">
                    <h3>📱 Подключение с других устройств:</h3>
                    <ul>
                        <li>Убедитесь, что устройства в одной WiFi сети</li>
                        <li>Откройте: <strong>http://${localIP}:${PORT}/</strong></li>
                        <li>Если не работает, проверьте файрвол</li>
                    </ul>
                </div>

                <p><a href="/info">📊 Информация о сервере</a> | <a href="/health">❤️ Статус здоровья</a></p>
            </div>
        </body>
        </html>
      `);
    }
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 RentAdmin локальный сервер запущен!');
  console.log('=====================================');
  console.log('');
  console.log('🌐 ДОСТУП К СЕРВЕРУ:');
  console.log(`📍 Локально:    http://localhost:${PORT}/`);
  console.log(`📍 Из сети:     http://${localIP}:${PORT}/`);
  console.log(`📱 С телефона:  http://${localIP}:${PORT}/`);
  console.log('');
  console.log('📋 ПОЛЕЗНЫЕ ССЫЛКИ:');
  console.log(`ℹ️  Информация:  http://${localIP}:${PORT}/info`);
  console.log(`❤️  Здоровье:    http://${localIP}:${PORT}/health`);
  console.log(`🧪 API демо:     http://${localIP}:${PORT}/api/demo`);
  console.log('');
  console.log('📱 ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ:');
  console.log(`1. Подключитесь к той же WiFi сети`);
  console.log(`2. Откройте: http://${localIP}:${PORT}/`);
  console.log('');
  console.log('⏹️ Остановка: Ctrl+C');
  console.log('=====================================');
});

console.log('🚀 Запуск локального сервера...');
console.log(`📡 IP адрес: ${localIP}`);
console.log(`🔌 Порт: ${PORT}`);
console.log('');