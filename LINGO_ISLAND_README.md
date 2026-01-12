# 🏝️ Lingo Island

**Educational 3D Language Learning Game for Kids (Ages 6-12)**

A magical adventure where kids learn languages through interactive 3D gameplay, powered by AI-generated assets and voice recognition.

## 🎨 Visual Style: "Nano Banana"

- **High-gloss claymorphism** - Everything looks like premium vinyl toys
- **PBR rendering** - Physically-based materials for realistic lighting
- **Collectible aesthetic** - Characters and objects feel like designer toys

## 🦸 Characters

| Character | Description | Gameplay Module |
|-----------|-------------|-----------------|
| 🐞 **Nano Ladybug** | Metallic/glossy finish, action-oriented | Word Ninja (Runner) |
| 🧙 **Nano Harry** | Soft vinyl finish, magic-oriented | Magic Tracing |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   PlayCanvas    │◄───►│   Middleware    │◄───►│   Meshy.ai     │
│   Frontend      │     │   Server        │     │   API          │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                       │
       │                       │
       ▼                       ▼
  Web Speech API          SQLite Cache
```

## 📁 Project Structure

```
lingo-island/
├── client/                 # PlayCanvas Frontend
│   ├── src/
│   │   ├── core/          # Engine & Scene management
│   │   ├── services/      # Asset loading
│   │   ├── scenes/        # 3D scenes
│   │   ├── entities/      # Characters & objects
│   │   └── ui/            # HTML overlay UI
│   └── index.html
│
├── server/                 # Node.js Middleware
│   ├── src/
│   │   ├── db/            # SQLite database
│   │   ├── services/      # Meshy.ai integration
│   │   └── routes/        # API endpoints
│   └── public/assets/     # Cached GLB files
│
└── README.md
```

## 🚀 Quick Start

### 1. Setup Server (Middleware)

```bash
cd server
npm install
cp .env.example .env
# Add your MESHY_API_KEY to .env
npm run dev
```

Server runs at: `http://localhost:3001`

### 2. Setup Client (Frontend)

```bash
cd client
npm install
npm run dev
```

Client runs at: `http://localhost:5173`

### 3. Play!

Open `http://localhost:5173` in your browser.

## 🎮 Gameplay Modules

### Module A: Word Ninja 🐞
- **Character**: Nano Ladybug
- **Mechanics**: 3D runner, swipe to collect items
- **Goal**: Collect vocabulary objects while running

### Module B: Magic Tracing 🧙
- **Character**: Nano Harry Potter
- **Mechanics**: Trace letters in 3D with sparkle effects
- **Goal**: Learn letter shapes through magic

### Module C: Voice Spell 🎤
- **Integration**: Web Speech API
- **Mechanics**: Pronounce words to activate magic
- **Goal**: Practice pronunciation

### Module D: Smart Hints 💡
- **Tier 1**: Visual glow on objects
- **Tier 2**: Audio pronunciation
- **Tier 3**: Spelling mask (A _ _ _ E)

## 🔌 API Endpoints

### Middleware Server

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get-3d-model` | POST | Get/generate 3D model for keyword |
| `/api/assets` | GET | List all cached assets |
| `/api/styles` | GET | List available visual styles |
| `/api/health` | GET | Health check |
| `/assets/*.glb` | GET | Serve static 3D files |

### Request Example

```bash
curl -X POST http://localhost:3001/api/get-3d-model \
  -H "Content-Type: application/json" \
  -d '{"keyword": "apple", "style": "nano-banana"}'
```

### Response

```json
{
  "success": true,
  "keyword": "apple",
  "style": "nano-banana",
  "url": "/assets/apple_nano-banana.glb",
  "cached": false
}
```

## 🎨 Asset Styles

| Style | Description |
|-------|-------------|
| `nano-banana` | High-gloss claymorphism (default) |
| `vinyl-toy` | Soft vinyl designer toy finish |
| `metallic-gloss` | Chrome/metallic reflective |
| `cartoon-3d` | Animated movie quality |
| `low-poly` | Mobile-optimized geometric |

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | PlayCanvas (NPM), TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| 3D Generation | Meshy.ai API |
| Voice | Web Speech API |

## 📋 Environment Variables

### Server (.env)

```env
PORT=3001
MESHY_API_KEY=your_meshy_api_key
DATABASE_PATH=./data/lingo-island.db
ASSETS_DIR=./public/assets
```

## 🧪 Development

### Type Check Both Projects

```bash
# Server
cd server && npm run typecheck

# Client  
cd client && npm run typecheck
```

### Build for Production

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build
```

## 📖 Next Steps

1. **Implement Word Ninja module** - Runner mechanics with swipe controls
2. **Add Magic Tracing** - 3D path following for letter learning
3. **Integrate Gemini API** - Dynamic task generation and NPC dialogues
4. **Add more vocabulary** - Expand word database
5. **Mobile optimization** - Touch controls and responsive UI

## 📄 License

MIT

---

Built with ❤️ for young learners everywhere 🌍
