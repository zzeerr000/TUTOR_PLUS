# Мобильная версия (Capacitor)

## Требования

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (для Android)
- JDK 17+
- Запущенный backend Tutor+

## Быстрый старт (Android)

```bash
cd frontend
npm install
npm run cap:android
```

Android Studio откроет проект. Запустите эмулятор или подключите телефон и нажмите **Run**.

## URL backend для мобильного приложения

Веб использует прокси `/api`, мобильное приложение обращается к backend напрямую.

Файл `.env.mobile` (уже в репозитории):

```env
VITE_API_URL=http://10.0.2.2:3000
VITE_CAPACITOR=true
```

| Среда | VITE_API_URL |
|-------|----------------|
| Android-эмулятор | `http://10.0.2.2:3000` |
| Реальный телефон (Wi‑Fi) | `http://<IP-вашего-ПК>:3000` |
| Production | `https://your-domain.com` |

Для телефона создайте `.env.mobile.local` (не коммитится):

```env
VITE_API_URL=http://192.168.1.100:3000
VITE_CAPACITOR=true
```

Backend должен слушать `0.0.0.0:3000` и быть доступен в локальной сети (firewall).

## Команды

| Команда | Описание |
|---------|----------|
| `npm run build:mobile` | Сборка SPA для Capacitor |
| `npm run cap:sync` | Сборка + копирование в native-проект |
| `npm run cap:android` | Sync + открыть Android Studio |
| `npm run cap:run:android` | Sync + запуск на устройстве/эмуляторе |

После изменений в React-коде:

```bash
npm run cap:sync
```

## iOS (только macOS)

```bash
npx cap add ios
npm run cap:sync
npx cap open ios
```

Для iOS-симулятора используйте `VITE_API_URL=http://localhost:3000`.

## HTTP и Android

Для dev-сборки с HTTP (`http://10.0.2.2:3000`) в Android включён cleartext traffic через `network_security_config.xml`.

Для production используйте HTTPS.

## Структура

```
frontend/
├── capacitor.config.ts   # конфиг Capacitor
├── .env.mobile             # env для mobile-сборки
├── android/                # native Android-проект (после cap add)
└── build/                  # web-сборка для WebView
```
