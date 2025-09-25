# Инструкция по доверению SSL сертификата

## Проблема
Браузер показывает ошибку `ERR_CERT_AUTHORITY_INVALID` или `MOZILLA_PKIX_ERROR_SELF_SIGNED_CERT` при обращении к `https://87.242.103.146/api`

## Быстрое решение (в браузере)

### Chrome/Edge:
1. Перейдите на `https://87.242.103.146`
2. Нажмите **"Дополнительно"**
3. Нажмите **"Перейти на сайт 87.242.103.146 (небезопасно)"**

### Firefox:
1. Перейдите на `https://87.242.103.146`
2. Нажмите **"Дополнительно"**
3. Нажмите **"Принять риск и продолжить"**

## Постоянное решение (добавить сертификат в доверенные)

### Windows Chrome:
1. Откройте `https://87.242.103.146` в Chrome
2. Нажмите на иконку замка в адресной строке
3. **"Сертификат"** → **"Подробности"** → **"Копировать в файл"**
4. Сохраните как `.cer` файл
5. **Win+R** → `mmc` → **"Файл"** → **"Добавить оснастку"** → **"Сертификаты"**
6. **"Доверенные корневые центры сертификации"** → **"Сертификаты"** → ПКМ → **"Импорт"**
7. Выберите сохранённый `.cer` файл
8. Перезапустите браузер

### macOS:
1. Загрузите сертификат: `openssl s_client -connect 87.242.103.146:443 -servername 87.242.103.146 < /dev/null | openssl x509 -outform PEM > rentadmin.crt`
2. Откройте **"Связка ключей"** (Keychain Access)
3. Перетащите `rentadmin.crt` в **"Системные"** (System)
4. Найдите сертификат, двойной клик
5. **"Доверие"** → **"При использовании этого сертификата"** → **"Всегда доверять"**
6. Перезапустите браузер

### Linux:
1. Загрузите сертификат: `openssl s_client -connect 87.242.103.146:443 -servername 87.242.103.146 < /dev/null | openssl x509 -outform PEM > rentadmin.crt`
2. Скопируйте в системные сертификаты: `sudo cp rentadmin.crt /usr/local/share/ca-certificates/rentadmin.crt`
3. Обновите: `sudo update-ca-certificates`
4. Для Chrome: `chrome --ignore-certificate-errors --ignore-ssl-errors`

## Проверка
После настройки откройте `https://87.242.103.146/api/health` - должен отображаться JSON без ошибок SSL.

## Альтернатива для разработки
Используйте флаги браузера:
- Chrome: `--ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content`
- Firefox: `about:config` → `security.mixed_content.block_active_content` → `false`