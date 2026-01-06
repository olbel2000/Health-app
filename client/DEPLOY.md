# 🚀 Deploy to Firebase

## Option 1: Local Deploy (Interactive)

На своём компьютере:

```bash
# 1. Авторизуйся в Firebase
firebase login

# 2. Создай проект (если ещё нет)
firebase projects:create lingo-island-game

# 3. Собери и выгрузи
npm run deploy
```

## Option 2: CI/CD Deploy (с токеном)

### Шаг 1: Получи токен на своём компьютере

```bash
firebase login:ci
```

Скопируй полученный токен.

### Шаг 2: Выгрузи с токеном

```bash
export FIREBASE_TOKEN="your-token-here"
npm run deploy:ci
```

Или напрямую:

```bash
npm run build
firebase deploy --token "your-token-here"
```

## Option 3: GitHub Actions

Добавь в `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install & Build
        run: |
          cd client
          npm ci
          npm run build
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: lingo-island-game
          entryPoint: ./client
```

## Настройка проекта Firebase

### 1. Создай проект в Firebase Console

1. Иди на https://console.firebase.google.com
2. Нажми "Add project"
3. Назови его `lingo-island-game`
4. Отключи Google Analytics (опционально)
5. Нажми "Create project"

### 2. Включи Hosting

1. В левом меню выбери "Build" → "Hosting"
2. Нажми "Get started"
3. Следуй инструкциям

### 3. Обнови `.firebaserc`

Измени project ID в файле `.firebaserc`:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## После деплоя

Игра будет доступна по адресу:
- `https://lingo-island-game.web.app`
- `https://lingo-island-game.firebaseapp.com`

## Примечание

⚠️ **Важно**: Фронтенд выгружается в демо-режиме без бэкенда.
Для полной функциональности нужно:

1. Выгрузить бэкенд на Cloud Run / Railway / Render
2. Указать URL бэкенда в `VITE_API_URL`
3. Пересобрать и задеплоить фронтенд

```bash
# Пример с бэкендом на Cloud Run
echo "VITE_API_URL=https://lingo-island-api-xxxxx.run.app" > .env.production
echo "VITE_DEMO_MODE=false" >> .env.production
npm run deploy
```
