/**
 * Asset Loader Service
 * Handles communication with middleware and PlayCanvas asset loading
 */

import * as pc from 'playcanvas';
import type { Asset3DResponse, AssetStyle, AssetCacheEntry, MiddlewareConfig } from '../types';
import { Engine } from '../core/Engine';

const DEFAULT_CONFIG: MiddlewareConfig = {
  baseUrl: import.meta.env.VITE_API_URL || '',  // Empty for same-origin (proxied by Vite)
  defaultStyle: 'nano-banana',
  timeout: 120000,  // 2 minutes for generation
};

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export class AssetLoader {
  private static instance: AssetLoader | null = null;
  
  private config: MiddlewareConfig;
  private cache: Map<string, AssetCacheEntry> = new Map();
  private pendingLoads: Map<string, Promise<pc.Entity>> = new Map();

  private constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<MiddlewareConfig>): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader(config);
    }
    return AssetLoader.instance;
  }

  /**
   * Get cache key for keyword + style
   */
  private getCacheKey(keyword: string, style: AssetStyle): string {
    return `${keyword.toLowerCase()}_${style}`;
  }

  /**
   * Request 3D model from middleware
   */
  async request3DModel(keyword: string, style?: AssetStyle): Promise<Asset3DResponse> {
    const useStyle = style || this.config.defaultStyle;
    const url = `${this.config.baseUrl}/api/get-3d-model`;

    console.log(`[AssetLoader] Requesting: ${keyword} (${useStyle})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: keyword,
        style: useStyle,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return await response.json() as Asset3DResponse;
  }

  /**
   * Load a GLB model into PlayCanvas
   */
  async loadGLB(url: string, keyword: string): Promise<pc.Entity> {
    const engine = Engine.getInstance();
    const app = engine.app;
    
    return new Promise((resolve, reject) => {
      // Create container asset for GLB
      const asset = new pc.Asset(keyword, 'container', {
        url: url,
      });

      asset.on('load', () => {
        console.log(`[AssetLoader] GLB loaded: ${keyword}`);
        
        // Get the container resource
        const container = asset.resource as pc.ContainerResource;
        
        // Instantiate the model
        const entity = container.instantiateRenderEntity();
        entity.name = keyword;
        
        resolve(entity);
      });

      asset.on('error', (err: string) => {
        console.error(`[AssetLoader] Failed to load ${keyword}:`, err);
        reject(new Error(`Failed to load GLB: ${err}`));
      });

      // Start loading
      app.assets.add(asset);
      app.assets.load(asset);
    });
  }

  /**
   * Get or create a 3D entity for a keyword
   * This is the main method to use - handles caching automatically
   */
  async getEntity(keyword: string, style?: AssetStyle): Promise<pc.Entity> {
    // In demo mode, return a placeholder
    if (DEMO_MODE) {
      console.log(`[AssetLoader] Demo mode: creating placeholder for ${keyword}`);
      return this.createPlaceholderEntity(keyword);
    }

    const useStyle = style || this.config.defaultStyle;
    const cacheKey = this.getCacheKey(keyword, useStyle);

    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached?.entity) {
      console.log(`[AssetLoader] Cache hit: ${keyword}`);
      return cached.entity.clone();
    }

    // Check for pending load
    const pending = this.pendingLoads.get(cacheKey);
    if (pending) {
      console.log(`[AssetLoader] Waiting for pending: ${keyword}`);
      const entity = await pending;
      return entity.clone();
    }

    // Start new load
    const loadPromise = this.loadEntity(keyword, useStyle, cacheKey);
    this.pendingLoads.set(cacheKey, loadPromise);

    try {
      const entity = await loadPromise;
      return entity.clone();
    } finally {
      this.pendingLoads.delete(cacheKey);
    }
  }

  /**
   * Create a placeholder entity for demo mode
   */
  private createPlaceholderEntity(keyword: string): pc.Entity {
    const entity = new pc.Entity(keyword);
    
    // Create colorful placeholder based on keyword hash
    const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % 5;
    
    // Predefined vibrant colors
    const colors = [
      new pc.Color(1, 0.4, 0.4),    // Red
      new pc.Color(0.4, 0.8, 0.4),  // Green
      new pc.Color(0.4, 0.6, 1),    // Blue
      new pc.Color(1, 0.8, 0.2),    // Yellow
      new pc.Color(0.8, 0.4, 1),    // Purple
    ];
    
    const material = new pc.StandardMaterial();
    material.diffuse = colors[colorIndex];
    material.specular = new pc.Color(1, 1, 1);
    material.gloss = 0.9;
    material.metalness = 0.2;
    material.update();

    entity.addComponent('render', {
      type: 'sphere',
      material: material,
    });

    // Add floating text label (using a child entity)
    const labelEntity = new pc.Entity('label');
    labelEntity.setLocalPosition(0, 1.2, 0);
    entity.addChild(labelEntity);

    return entity;
  }

  /**
   * Internal method to load entity
   */
  private async loadEntity(keyword: string, style: AssetStyle, cacheKey: string): Promise<pc.Entity> {
    // Request from middleware (may generate)
    const response = await this.request3DModel(keyword, style);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get 3D model');
    }

    // Build full URL
    const modelUrl = response.url.startsWith('http') 
      ? response.url 
      : `${this.config.baseUrl}${response.url}`;

    // Load the GLB
    const entity = await this.loadGLB(modelUrl, keyword);

    // Cache it
    const engine = Engine.getInstance();
    this.cache.set(cacheKey, {
      keyword,
      style,
      asset: engine.app.assets.find(keyword) as pc.Asset,
      entity,
      loadedAt: Date.now(),
    });

    return entity;
  }

  /**
   * Preload multiple keywords
   */
  async preload(keywords: string[], style?: AssetStyle): Promise<void> {
    console.log(`[AssetLoader] Preloading ${keywords.length} assets...`);
    
    const promises = keywords.map(keyword => 
      this.getEntity(keyword, style).catch(err => {
        console.warn(`[AssetLoader] Failed to preload ${keyword}:`, err);
        return null;
      })
    );

    await Promise.all(promises);
    console.log(`[AssetLoader] Preload complete`);
  }

  /**
   * Check if keyword is cached
   */
  isCached(keyword: string, style?: AssetStyle): boolean {
    const useStyle = style || this.config.defaultStyle;
    const cacheKey = this.getCacheKey(keyword, useStyle);
    return this.cache.has(cacheKey);
  }

  /**
   * Get available styles from server
   */
  async getStyles(): Promise<Array<{ id: string; name: string; description: string }>> {
    const response = await fetch(`${this.config.baseUrl}/api/styles`);
    const data = await response.json();
    return data.styles || [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[AssetLoader] Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export default AssetLoader;
