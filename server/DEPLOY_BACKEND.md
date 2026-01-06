# 🚀 Деплой бэкенда Lingo Island

## Шаг 1: Получи Meshy.ai API ключ

1. Иди на **https://www.meshy.ai/**
2. Зарегистрируйся (бесплатно)
3. В Dashboard найди **API Key**
4. Скопируй ключ

## Шаг 2: Выбери платформу для деплоя

### Вариант A: Railway (рекомендую - проще всего)

1. Иди на **https://railway.app/**
2. Войди через GitHub
3. Нажми **"New Project"** → **"Deploy from GitHub repo"**
4. Выбери репозиторий с проектом
5. В настройках укажи:
   - **Root Directory**: `server`
   - **Start Command**: `npm run build && npm start`
6. Добавь переменные окружения:
   ```
   MESHY_API_KEY=твой_ключ_meshy
   NODE_ENV=production
   PORT=3001
   ```
7. Нажми Deploy!

После деплоя получишь URL типа: `https://lingo-island-xxx.railway.app`

### Вариант B: Render.com

1. Иди на **https://render.com/**
2. Войди через GitHub
3. Нажми **"New"** → **"Web Service"**
4. Выбери репозиторий
5. Настройки:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Добавь Environment Variables:
   ```
   MESHY_API_KEY=твой_ключ_meshy
   ```
7. Deploy!

### Вариант C: Google Cloud Run

```bash
# Собери Docker образ
cd server
docker build -t lingo-island-api .

# Задеплой на Cloud Run
gcloud run deploy lingo-island-api \
  --image lingo-island-api \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MESHY_API_KEY=твой_ключ
```

## Шаг 3: Подключи фронтенд к бэкенду

1. Обнови `.env.production` в папке `client`:

```env
VITE_API_URL=https://твой-бэкенд-url.railway.app
VITE_DEMO_MODE=false
```

2. Пересобери и задеплой фронтенд:

```bash
cd client
npm run build
firebase deploy
```

## Проверка

После деплоя проверь:

```bash
curl https://твой-бэкенд-url/api/health
```

Должен вернуть:
```json
{
  "success": true,
  "services": {
    "database": true,
    "meshyApi": true
  }
}
```

## Тест генерации 3D модели

```bash
curl -X POST https://твой-бэкенд-url/api/get-3d-model \
  -H "Content-Type: application/json" \
  -d '{"keyword": "apple", "style": "nano-banana"}'
```

⚠️ Первая генерация занимает 1-3 минуты!

## Стоимость

- **Meshy.ai**: 200 бесплатных credits/месяц (примерно 20 моделей)
- **Railway**: $5/месяц или бесплатно с ограничениями
- **Render**: Бесплатный tier доступен
- **Firebase Hosting**: Бесплатно для небольших проектов
