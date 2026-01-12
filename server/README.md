# 🏝️ Lingo Island Middleware Server

AI-powered 3D Asset Orchestrator for the Lingo Island educational game.

## Overview

This middleware server acts as an intelligent cache and orchestrator between the PlayCanvas frontend and the Meshy.ai 3D generation API. It implements a **Check-then-Generate** strategy:

1. **Client Request**: Frontend asks for a 3D model by keyword
2. **Cache Check**: Server checks SQLite database for existing asset
3. **Cache Hit**: Return the local `.glb` file URL immediately
4. **Cache Miss**: Generate via Meshy.ai, download, cache, and return

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) for metadata caching
- **3D Generation**: Meshy.ai Text-to-3D API
- **Build Tool**: tsx (development), tsc (production)

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
PORT=3001
MESHY_API_KEY=your_meshy_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### `POST /api/get-3d-model`

Get or generate a 3D model for a keyword.

**Request:**
```json
{
  "keyword": "apple",
  "style": "nano-banana"
}
```

**Response (Cache Hit):**
```json
{
  "success": true,
  "keyword": "apple",
  "style": "nano-banana",
  "url": "/assets/apple_nano-banana.glb",
  "cached": true,
  "message": "Asset retrieved from cache"
}
```

**Response (Generated):**
```json
{
  "success": true,
  "keyword": "apple",
  "style": "nano-banana", 
  "url": "/assets/apple_nano-banana.glb",
  "cached": false,
  "message": "Asset generated successfully"
}
```

### `GET /api/assets`

List all cached assets.

### `GET /api/assets/search?q=<query>`

Search assets by keyword pattern.

### `GET /api/styles`

List available asset styles:
- `nano-banana` - High-gloss claymorphism (default)
- `vinyl-toy` - Soft vinyl finish
- `metallic-gloss` - Metallic/glossy finish
- `cartoon-3d` - Vibrant cartoon style
- `low-poly` - Low-poly stylized

### `GET /api/health`

Health check endpoint returning service status.

### `DELETE /api/assets/:id`

Delete a cached asset by ID.

### `GET /assets/<filename>`

Serve static GLB files directly.

## Asset Styles

The server supports multiple visual styles for the "Nano Banana" aesthetic:

| Style | Description |
|-------|-------------|
| `nano-banana` | High-gloss vinyl toy, claymorphism, PBR materials |
| `vinyl-toy` | Soft-touch vinyl finish, designer toy aesthetic |
| `metallic-gloss` | Metallic glossy finish, chrome accents |
| `cartoon-3d` | 3D cartoon style, animated movie quality |
| `low-poly` | Low-poly stylized, mobile-optimized |

## Database Schema

```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  style TEXT NOT NULL,
  local_url TEXT NOT NULL,
  meshy_task_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(keyword, style)
);
```

## Project Structure

```
server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── db/
│   │   └── database.ts   # SQLite database service
│   ├── services/
│   │   └── meshyService.ts # Meshy.ai API integration
│   ├── routes/
│   │   └── assetRoutes.ts  # API route handlers
│   └── types/
│       └── index.ts       # TypeScript type definitions
├── public/
│   └── assets/           # Generated GLB files stored here
├── data/                 # SQLite database files
├── package.json
├── tsconfig.json
└── .env.example
```

## Frontend Integration

### PlayCanvas Example

```typescript
// Load 3D model in PlayCanvas
async function loadWordModel(keyword: string): Promise<pc.Entity> {
  const response = await fetch('http://localhost:3001/api/get-3d-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, style: 'nano-banana' })
  });
  
  const data = await response.json();
  
  if (data.success) {
    const modelUrl = `http://localhost:3001${data.url}`;
    // Load GLB into PlayCanvas...
  }
}
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run typecheck` | Run TypeScript type checking |

## License

MIT
