# 🏝️ Lingo Island - Client

Educational 3D Language Learning Game built with PlayCanvas and TypeScript.

## Overview

This is the frontend client for Lingo Island, featuring:
- **PlayCanvas Engine** (NPM, engine-only) for 3D rendering
- **TypeScript** for type-safe development
- **Vite** for fast builds and hot reload
- **PBR Lighting** for that "Nano Banana" vinyl toy aesthetic

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The client will start at `http://localhost:5173`

**Note:** Make sure the middleware server is running at `http://localhost:3001` for 3D asset loading.

### 3. Build for Production

```bash
npm run build
```

## Project Structure

```
client/
├── src/
│   ├── main.ts              # Application entry point
│   ├── core/
│   │   ├── Engine.ts        # PlayCanvas engine wrapper
│   │   └── SceneManager.ts  # Scene lifecycle management
│   ├── services/
│   │   └── AssetLoader.ts   # Middleware API & asset loading
│   ├── scenes/
│   │   └── IslandScene.ts   # Main island world scene
│   ├── entities/
│   │   └── Character.ts     # Character controllers
│   ├── ui/
│   │   └── UIManager.ts     # HTML overlay UI management
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── public/                  # Static assets
├── index.html               # Main HTML with UI overlay
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture

### Game Flow

```
1. Initialize Engine (PlayCanvas)
2. Check server connection
3. Load Island Scene
4. Character Selection (Ladybug / Harry)
5. Game Loop:
   - Show word
   - Load 3D model (via middleware)
   - Wait for speech input
   - Check answer
   - Update score/streak
   - Next word
```

### Characters

| Character | Style | Abilities |
|-----------|-------|-----------|
| **Nano Ladybug** | Metallic Gloss | Dash, Double Jump |
| **Nano Harry** | Soft Vinyl | Trace Spell, Levitate |

### Visual Style

The game uses a "Nano Banana" aesthetic:
- High-gloss claymorphism
- PBR materials with vinyl/plastic look
- Bright, saturated colors
- Soft shadows and ambient occlusion

## Keyboard Controls

| Key | Action |
|-----|--------|
| W/↑ | Move forward |
| S/↓ | Move backward |
| A/← | Move left |
| D/→ | Move right |
| Space | Jump |
| Shift | Special ability |
| H | Hint |
| M | Microphone |
| N | Skip word |

## UI Features

### Smart Hints System

3-tier progressive hint system:
1. **Tier 1**: Visual glow on 3D object
2. **Tier 2**: Audio pronunciation
3. **Tier 3**: Spelling mask (A _ _ _ E)

### Voice Recognition

Uses Web Speech API for:
- Voice input for spelling words
- Magic spell activation (Module C)

## Integration with Middleware

The client connects to the middleware server to:
1. Fetch 3D models for vocabulary words
2. Cache assets locally
3. Generate new 3D models on-demand via Meshy.ai

```typescript
// Example: Load a 3D model
const entity = await assetLoader.getEntity('apple');
scene.addChild(entity);
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |

## Future Modules

- **Module A (Word Ninja)**: 3D runner mechanics for Ladybug
- **Module B (Magic Tracing)**: Letter tracing with sparkle effects
- **Module C (Voice Spell)**: Magic triggered by pronunciation
- **Module D (Smart Hints)**: Full hint system implementation

## License

MIT
