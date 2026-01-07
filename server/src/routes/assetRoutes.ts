/**
 * Asset API Routes
 * Handles 3D model retrieval with cache-first strategy
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../db/database.js';
import { TripoService } from '../services/tripoService.js';
import type { 
  Get3DModelRequest, 
  Get3DModelResponse, 
  ErrorResponse,
  AssetStyle 
} from '../types/index.js';
import { STYLE_CONFIGS } from '../types/index.js';

const router = Router();

// Initialize services (lazy init for TripoService to ensure env vars are loaded)
const db = DatabaseService.getInstance();
let tripoInstance: TripoService | null = null;

function getTripoService(): TripoService {
  if (!tripoInstance) {
    tripoInstance = new TripoService();
  }
  return tripoInstance;
}

/**
 * POST /api/get-3d-model
 * 
 * Check-then-Generate logic:
 * 1. Check SQLite cache for existing asset
 * 2. If found, return cached URL
 * 3. If not found, generate via Meshy.ai, cache, and return
 */
router.post('/get-3d-model', async (
  req: Request<object, object, Get3DModelRequest>,
  res: Response<Get3DModelResponse | ErrorResponse>
) => {
  try {
    const { keyword, style = 'nano-banana' } = req.body;

    // Validate keyword
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid "keyword" parameter',
        code: 'INVALID_KEYWORD'
      });
      return;
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (normalizedKeyword.length === 0 || normalizedKeyword.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Keyword must be between 1 and 100 characters',
        code: 'INVALID_KEYWORD_LENGTH'
      });
      return;
    }

    // Validate style
    const validStyles = Object.keys(STYLE_CONFIGS) as AssetStyle[];
    if (!validStyles.includes(style)) {
      res.status(400).json({
        success: false,
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}`,
        code: 'INVALID_STYLE'
      });
      return;
    }

    console.log(`[API] Request for "${normalizedKeyword}" with style "${style}"`);

    // Step 1: Check cache
    const cachedAsset = db.findAsset(normalizedKeyword, style);
    
    if (cachedAsset) {
      // Verify file still exists
      const assetsDir = process.env.ASSETS_DIR || './public/assets';
      const fullPath = path.join(assetsDir, path.basename(cachedAsset.local_url));
      
      if (fs.existsSync(fullPath)) {
        console.log(`[API] Cache HIT for "${normalizedKeyword}"`);
        res.json({
          success: true,
          keyword: normalizedKeyword,
          style: style,
          url: cachedAsset.local_url,
          cached: true,
          message: 'Asset retrieved from cache'
        });
        return;
      } else {
        // File missing, remove stale cache entry
        console.log(`[API] Cache entry exists but file missing, regenerating...`);
        db.deleteAsset(cachedAsset.id);
      }
    }

    // Step 2: Cache miss - check if Tripo is configured
    const tripo = getTripoService();
    if (!tripo.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Asset generation service not configured. Set TRIPO_API_KEY.',
        code: 'SERVICE_UNAVAILABLE'
      });
      return;
    }

    console.log(`[API] Cache MISS for "${normalizedKeyword}" - generating via Tripo3D...`);

    // Step 3: Generate via Tripo3D
    const { filename, taskId } = await tripo.generateAndDownload(normalizedKeyword, style);
    const localUrl = `/assets/${filename}`;

    // Step 4: Cache the result
    db.insertAsset({
      keyword: normalizedKeyword,
      style: style,
      local_url: localUrl,
      meshy_task_id: taskId
    });

    console.log(`[API] Generated and cached "${normalizedKeyword}" at ${localUrl}`);

    res.json({
      success: true,
      keyword: normalizedKeyword,
      style: style,
      url: localUrl,
      cached: false,
      message: 'Asset generated successfully'
    });

  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'GENERATION_ERROR'
    });
  }
});

/**
 * GET /api/assets
 * List all cached assets
 */
router.get('/assets', (_req: Request, res: Response) => {
  try {
    const assets = db.getAllAssets();
    res.json({
      success: true,
      count: assets.length,
      assets: assets
    });
  } catch (error) {
    console.error('[API] Error listing assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list assets'
    });
  }
});

/**
 * GET /api/assets/search
 * Search assets by keyword pattern
 */
router.get('/assets/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing search query parameter "q"'
      });
      return;
    }

    const assets = db.searchAssets(q);
    res.json({
      success: true,
      query: q,
      count: assets.length,
      assets: assets
    });
  } catch (error) {
    console.error('[API] Error searching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search assets'
    });
  }
});

/**
 * GET /api/styles
 * List available asset styles
 */
router.get('/styles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    styles: Object.entries(STYLE_CONFIGS).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.promptModifier
    }))
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  const tripo = getTripoService();
  res.json({
    success: true,
    status: 'healthy',
    services: {
      database: true,
      tripoApi: tripo.isConfigured()
    },
    assetCount: db.getAssetCount(),
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/assets/:id
 * Delete a cached asset (admin endpoint)
 */
router.delete('/assets/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid asset ID'
      });
      return;
    }

    // Get asset info before deletion
    const asset = db.getAssetById(id);
    if (!asset) {
      res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
      return;
    }

    // Delete file if exists
    const assetsDir = process.env.ASSETS_DIR || './public/assets';
    const filePath = path.join(assetsDir, path.basename(asset.local_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    db.deleteAsset(id);

    res.json({
      success: true,
      message: `Asset "${asset.keyword}" deleted successfully`
    });
  } catch (error) {
    console.error('[API] Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
});

export default router;
