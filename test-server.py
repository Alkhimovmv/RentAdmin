#!/usr/bin/env python3

"""
Экстренный тестовый HTTP сервер на Python
Работает на порту 8080 БЕЗ зависимостей
"""

import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import os

PORT = 8080

class RentAdminHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        print(f"[{datetime.now().strftime('%H:%M:%S')}] GET {path}")

        # CORS headers
        self.send_cors_headers()

        if path == '/api/health':
            self.send_json_response({
                'status': 'ok',
                'timestamp': datetime.now().isoformat(),
                'server': 'Python Test Server',
                'port': PORT,
                'message': 'RentAdmin Python API работает!'
            })

        elif path == '/' or path == '/api':
            self.send_json_response({
                'message': 'RentAdmin Python Test Server',
                'status': 'running',
                'port': PORT,
                'endpoints': {
                    'health': '/api/health',
                    'auth': '/api/auth/login',
                    'equipment': '/api/equipment',
                    'test': '/api/test'
                }
            })

        elif path == '/api/equipment':
            self.send_json_response([
                {'id': 1, 'name': 'Дрель Python', 'status': 'available', 'price': 500},
                {'id': 2, 'name': 'Миксер Python', 'status': 'rented', 'price': 800}
            ])

        elif path == '/api/test':
            self.send_json_response({
                'test': 'success',
                'server': 'Python',
                'time': datetime.now().isoformat(),
                'working': True
            })

        else:
            self.send_json_response({
                'error': 'Endpoint не найден',
                'path': path,
                'available': ['/api/health', '/api/equipment', '/api/test', '/']
            }, status=404)

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Читаем данные POST
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except:
            data = {}

        print(f"[{datetime.now().strftime('%H:%M:%S')}] POST {path} - Data: {data}")

        # CORS headers
        self.send_cors_headers()

        if path == '/api/auth/login':
            email = data.get('email', '')
            password = data.get('password', '')

            if email and password:
                self.send_json_response({
                    'token': f'python-token-{int(datetime.now().timestamp())}',
                    'user': {'email': email, 'name': 'Python Test User'},
                    'message': 'Успешный вход (Python mock)'
                })
            else:
                self.send_json_response({
                    'error': 'Email и пароль обязательны'
                }, status=400)

        elif path == '/api/auth/verify-pin':
            pin = data.get('pin', '')

            if pin == '20031997':
                self.send_json_response({
                    'token': f'python-admin-{int(datetime.now().timestamp())}',
                    'message': 'PIN код верный (Python)'
                })
            else:
                self.send_json_response({
                    'error': 'Неверный PIN код'
                }, status=400)

        else:
            self.send_json_response({
                'error': 'POST endpoint не найден',
                'path': path
            }, status=404)

    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] OPTIONS {self.path}")

        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '1728000')
        self.end_headers()

    def send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'false')

    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        response = json.dumps(data, ensure_ascii=False, indent=2)

        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_cors_headers()
        self.end_headers()

        self.wfile.write(response.encode('utf-8'))

    def log_message(self, format, *args):
        """Подавляем стандартное логирование - используем свое"""
        pass

def main():
    print("=" * 60)
    print("🐍 RentAdmin Python Test Server")
    print(f"📡 Порт: {PORT}")
    print(f"🌐 URL: http://0.0.0.0:{PORT}")
    print(f"🔗 Health: https://87.242.103.146:{PORT}/api/health")
    print("=" * 60)

    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), RentAdminHandler) as httpd:
            print(f"✅ Сервер запущен на порту {PORT}")
            print("Нажмите Ctrl+C для остановки")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()