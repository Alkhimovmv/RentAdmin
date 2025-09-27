#!/bin/bash

echo "🔧 Исправление ошибки 403 Forbidden"
echo "==================================="

# Проверяем существование директории
if [ ! -d "/var/www/html/rentadmin" ]; then
    echo "📁 Создание директории..."
    sudo mkdir -p /var/www/html/rentadmin
fi

# Исправление прав доступа
echo "🔧 Исправление прав доступа..."
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin

# Проверяем существование index.html
if [ ! -f "/var/www/html/rentadmin/index.html" ]; then
    echo "📄 Создание тестовой страницы..."
    sudo tee /var/www/html/rentadmin/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentAdmin - Тест</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { padding: 12px 24px; margin: 10px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
        button:hover { background: #0056b3; }
        #result { margin-top: 20px; text-align: left; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: left; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 RentAdmin</h1>
        <div class="status success">
            <h3>✅ Сервер работает успешно!</h3>
            <p>Проблема 403 Forbidden исправлена</p>
        </div>

        <div class="status info">
            <p><strong>Сервер:</strong> 87.242.103.146</p>
            <p><strong>API Endpoint:</strong> <a href="/api/health" target="_blank">/api/health</a></p>
            <p><strong>Пароль:</strong> 20031997</p>
        </div>

        <h2>🧪 Тестирование API</h2>
        <button onclick="testHealth()">🏥 Проверить API</button>
        <button onclick="testLogin()">🔑 Тест авторизации</button>
        <button onclick="testAllEndpoints()">📋 Все endpoints</button>

        <div id="result"></div>
    </div>

    <script>
        async function testHealth() {
            showLoading();
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                showResult('✅ API Health Check', data);
            } catch (error) {
                showError('❌ Ошибка Health Check', error.message);
            }
        }

        async function testLogin() {
            showLoading();
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: '20031997' })
                });
                const data = await response.json();
                showResult('✅ Тест авторизации', data);
            } catch (error) {
                showError('❌ Ошибка авторизации', error.message);
            }
        }

        async function testAllEndpoints() {
            showLoading();
            const endpoints = [
                { url: '/api/health', name: 'Health Check' },
                { url: '/api/rentals', name: 'Rentals' },
                { url: '/api/customers', name: 'Customers' },
                { url: '/api/equipment', name: 'Equipment' },
                { url: '/api/expenses', name: 'Expenses' },
                { url: '/api/analytics/dashboard', name: 'Analytics' }
            ];

            const results = {};
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint.url);
                    const data = await response.json();
                    results[endpoint.name] = { status: '✅', data: data };
                } catch (error) {
                    results[endpoint.name] = { status: '❌', error: error.message };
                }
            }
            showResult('📋 Все Endpoints', results);
        }

        function showLoading() {
            document.getElementById('result').innerHTML =
                '<div class="status info">⏳ Загрузка...</div>';
        }

        function showResult(title, data) {
            document.getElementById('result').innerHTML =
                '<div class="status success"><h4>' + title + '</h4><pre>' +
                JSON.stringify(data, null, 2) + '</pre></div>';
        }

        function showError(title, error) {
            document.getElementById('result').innerHTML =
                '<div class="status error"><h4>' + title + '</h4><p>' + error + '</p></div>';
        }

        // Автоматический тест при загрузке
        window.onload = function() {
            setTimeout(testHealth, 1000);
        };
    </script>
</body>
</html>
EOF

    # Устанавливаем правильные права
    sudo chown www-data:www-data /var/www/html/rentadmin/index.html
    sudo chmod 644 /var/www/html/rentadmin/index.html
fi

# Проверяем права на все файлы
echo "📋 Проверка прав доступа..."
sudo find /var/www/html/rentadmin -type d -exec chmod 755 {} \;
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;

# Перезапуск nginx
echo "🔄 Перезапуск nginx..."
sudo systemctl restart nginx

# Проверка
echo ""
echo "🧪 ПРОВЕРКА РЕЗУЛЬТАТА:"
echo "======================"

sleep 2

if curl -s http://localhost/ | grep -q "RentAdmin"; then
    echo "✅ Фронтенд доступен"
    echo "🌍 Откройте: http://87.242.103.146/"
else
    echo "❌ Проблема все еще есть"
    echo ""
    echo "🔍 ДИАГНОСТИКА:"
    echo "sudo ls -la /var/www/html/rentadmin/"
    echo "sudo nginx -t"
    echo "sudo systemctl status nginx"
fi

echo ""
echo "📋 Структура файлов:"
sudo ls -la /var/www/html/rentadmin/ | head -10