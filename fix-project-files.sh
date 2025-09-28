#!/bin/bash

# ==========================================
# Скрипт исправления файлов проекта
# Для восстановления правильного package.json
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

fix_frontend_files() {
    log "🔧 Исправление файлов frontend..."

    PROJECT_DIR="/opt/rentadmin"

    if [ ! -d "$PROJECT_DIR" ]; then
        error "Директория $PROJECT_DIR не найдена!"
    fi

    cd $PROJECT_DIR

    if [ ! -d "frontend" ]; then
        error "Директория frontend не найдена!"
    fi

    cd frontend

    # Создание правильного package.json
    log "Создание правильного package.json..."
    cat > package.json << 'EOF'
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@tanstack/react-query": "^4.36.1",
    "@types/node": "^20.11.5",
    "autoprefixer": "^10.4.21",
    "axios": "^1.6.7",
    "date-fns": "^4.1.0",
    "postcss": "^8.4.35",
    "react": "^18.2.0",
    "react-datepicker": "^8.7.0",
    "react-datetime-picker": "^7.0.1",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^8.56.0",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "globals": "^13.24.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.2.2",
    "typescript-eslint": "^7.0.1",
    "vite": "^5.1.0",
    "vitest": "^1.2.2"
  }
}
EOF

    # Исправление прав доступа
    log "Исправление прав доступа..."
    sudo chown -R $USER:$USER .

    # Проверка наличия vite.config.ts
    if [ ! -f "vite.config.ts" ]; then
        log "Создание vite.config.ts..."
        cat > vite.config.ts << 'EOF'
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@tanstack/react-query']
        }
      }
    }
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api')
  }
})
EOF
    fi

    # Проверка наличия tsconfig.json
    if [ ! -f "tsconfig.json" ]; then
        log "Создание tsconfig.json..."
        cat > tsconfig.json << 'EOF'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
EOF
    fi

    # Очистка старых зависимостей
    if [ -d "node_modules" ]; then
        log "Очистка node_modules..."
        rm -rf node_modules
        rm -f package-lock.json
    fi

    log "✅ Файлы frontend исправлены!"
}

# Обработка прерывания
trap 'error "Процесс прерван пользователем"' INT

# Запуск
fix_frontend_files