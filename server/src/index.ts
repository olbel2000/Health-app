/**
 * Lingo Island Middleware Server
 * AI-powered 3D Asset Orchestrator
 * 
 * This server acts as a middleware between the PlayCanvas frontend
 * and the Meshy.ai 3D generation API, with SQLite caching.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import assetRoutes from './routes/assetRoutes.js';
import { DatabaseService } from './db/database.js';

// Load environment variables
dotenv.config();

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// ============================================
// Middleware
// ============================================

// CORS configuration for PlayCanvas frontend
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON body parser
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Static Files
// ============================================

// Serve GLB assets from /assets path
const assetsDir = process.env.ASSETS_DIR || path.join(__dirname, '..', 'public', 'assets');
app.use('/assets', express.static(assetsDir, {
  setHeaders: (res, filePath) => {
    // Set proper headers for GLB files
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// ============================================
// API Routes
// ============================================

app.use('/api', assetRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Lingo Island Middleware',
    version: '1.0.0',
    description: 'AI-powered 3D Asset Orchestrator for Lingo Island',
    endpoints: {
      'POST /api/get-3d-model': 'Get or generate a 3D model for a keyword',
      'GET /api/assets': 'List all cached assets',
      'GET /api/assets/search?q=<query>': 'Search assets by keyword',
      'GET /api/styles': 'List available asset styles',
      'GET /api/health': 'Health check',
      'DELETE /api/assets/:id': 'Delete a cached asset',
      'GET /assets/<filename>': 'Serve static GLB files'
    },
    documentation: 'https://github.com/lingo-island/middleware'
  });
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ============================================
// Server Startup
// ============================================

function startServer(): void {
  // Initialize database
  const db = DatabaseService.getInstance();
  console.log(`[Server] Database initialized with ${db.getAssetCount()} cached assets`);

  // Start listening
  app.listen(PORT, () => {
    console.log('');
    console.log('🏝️  ═══════════════════════════════════════════════════');
    console.log('   LINGO ISLAND MIDDLEWARE SERVER');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   🌐 Server running at: http://localhost:${PORT}`);
    console.log(`   📁 Assets directory:  ${assetsDir}`);
    console.log(`   🔧 Environment:       ${NODE_ENV}`);
    console.log(`   🔑 Meshy API:         ${process.env.MESHY_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  DatabaseService.getInstance().close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down...');
  DatabaseService.getInstance().close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
