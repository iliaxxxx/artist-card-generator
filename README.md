# Artist Card Generator

Генератор карточек артиста для музыкальных площадок.

## Стек
- **Frontend:** Vue 3 (CDN), Vanilla JS, CSS
- **Backend:** PHP 7.4+
- **Без сборщиков** — работает из коробки

## Структура
```
├── index.php          # Главная страница
├── css/style.css      # Стили
├── js/app.js          # Vue-приложение
├── api/process.php    # API обработки (опционально)
├── logo-black.png     # Логотип для светлой темы
├── logo-white.png     # Логотип для тёмной темы
├── uploads/           # Временные загрузки
└── output/            # Сгенерированные файлы
```

## Установка

1. Залить файлы на сервер с PHP 7.4+
2. Создать папки `uploads/` и `output/` с правами на запись:
   ```bash
   mkdir -p uploads output
   chmod 755 uploads output
   ```
3. Открыть в браузере

## Требования
- PHP 7.4+ с GD
- Веб-сервер (Apache/Nginx)

## Nginx конфиг (пример)
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/card-generator;
    index index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## Функционал
- 🎴 **Карточки** — 3 формата: VK Web (1820×458), VK Mobile (1500×1120), Yandex (2000×2000)
- 💿 **Обложки** — формат 1500×1500
- 🌐 **Мультиязычность** — RU/EN
- 🌙 **Тёмная тема**
- 📱 **Адаптивный дизайн**

## Кастомизация
- Логотипы: заменить `logo-black.png` и `logo-white.png`
- Цвета: изменить CSS-переменные в `css/style.css`
- Тексты: изменить объект `translations` в `js/app.js`
