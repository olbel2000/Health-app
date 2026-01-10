/**
 * Asset Loader Service
 * Handles communication with middleware and PlayCanvas asset loading
 * Now with beautiful procedural 3D model generation!
 */

import * as pc from 'playcanvas';
import type { Asset3DResponse, AssetStyle, AssetCacheEntry, MiddlewareConfig } from '../types';
import { Engine } from '../core/Engine';
import { WordModelGenerator } from '../entities/WordModelGenerator';

const DEFAULT_CONFIG: MiddlewareConfig = {
  baseUrl: import.meta.env.VITE_API_URL || '',  // Empty for same-origin (proxied by Vite)
  defaultStyle: 'nano-banana',
  timeout: 180000,  // 3 minutes for generation (Meshy can take a while)
};

// Check if API is available
let API_AVAILABLE = false;
let DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Try to detect API availability
async function checkApiAvailability(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    // Check for either tripoApi or meshyApi
    return data.success && (data.services?.tripoApi === true || data.services?.meshyApi === true);
  } catch {
    return false;
  }
}

export class AssetLoader {
  private static instance: AssetLoader | null = null;

  private config: MiddlewareConfig;
  private cache: Map<string, AssetCacheEntry> = new Map();
  private pendingLoads: Map<string, Promise<pc.Entity>> = new Map();
  private wordModelGenerator: WordModelGenerator | null = null;

  private constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Check API availability on init
    this.initApiCheck();
  }

  /**
   * Get WordModelGenerator (lazy init)
   */
  private getWordModelGenerator(): WordModelGenerator {
    if (!this.wordModelGenerator) {
      this.wordModelGenerator = new WordModelGenerator();
    }
    return this.wordModelGenerator;
  }

  /**
   * Check if the API is available
   */
  private async initApiCheck(): Promise<void> {
    if (!DEMO_MODE) {
      API_AVAILABLE = await checkApiAvailability(this.config.baseUrl);
      if (!API_AVAILABLE) {
        console.log('[AssetLoader] API not available, running in demo mode');
        DEMO_MODE = true;
      } else {
        console.log('[AssetLoader] API available, 3D generation enabled');
      }
    }
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
   * Load a Texture from URL
   */
  async loadTexture(url: string, name: string): Promise<pc.Texture> {
    const engine = Engine.getInstance();
    const app = engine.app;

    return new Promise((resolve, reject) => {
      // Check if already loaded
      const existingAsset = app.assets.find(name);
      if (existingAsset && existingAsset.resource) {
        resolve(existingAsset.resource as pc.Texture);
        return;
      }

      const asset = new pc.Asset(name, 'texture', {
        url: url,
      });

      asset.on('load', () => {
        console.log(`[AssetLoader] Texture loaded: ${name}`);
        resolve(asset.resource as pc.Texture);
      });

      asset.on('error', (err: string) => {
        console.error(`[AssetLoader] Failed to load texture ${name}:`, err);
        reject(new Error(`Failed to load texture: ${err}`));
      });

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
   * Create a beautiful 3D entity for demo mode
   * Uses WordModelGenerator for known words, falls back to magical orb
   */
  private createPlaceholderEntity(keyword: string): pc.Entity {
    const generator = this.getWordModelGenerator();

    // Try to get a procedural model first
    if (generator.hasModel(keyword)) {
      console.log(`[AssetLoader] Using procedural 3D model for: ${keyword}`);
      const model = generator.getModel(keyword);
      if (model) {
        // Add floating animation container
        const container = new pc.Entity(keyword);
        container.addChild(model);

        // Add magical glow around the model
        this.addMagicalGlow(container, keyword);

        return container;
      }
    }

    console.log(`[AssetLoader] Creating placeholder orb for: ${keyword}`);
    return this.createMagicalOrb(keyword);
  }

  /**
   * Add magical glow effect to a model
   */
  private addMagicalGlow(entity: pc.Entity, keyword: string): void {
    const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % 5;

    const colors = [
      new pc.Color(1, 0.35, 0.4),     // Ruby
      new pc.Color(0.35, 0.85, 0.45), // Emerald
      new pc.Color(0.35, 0.55, 1),    // Sapphire
      new pc.Color(1, 0.85, 0.25),    // Gold
      new pc.Color(0.85, 0.4, 1),     // Amethyst
    ];

    const color = colors[colorIndex];

    // Add glowing particles around the model
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = color;
    glowMat.emissive = new pc.Color(color.r * 0.5, color.g * 0.5, color.b * 0.5);
    glowMat.opacity = 0.3;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();

    // Add small floating orbs around the model
    for (let i = 0; i < 4; i++) {
      const orb = new pc.Entity(`glow_${i}`);
      orb.addComponent('render', { type: 'sphere', material: glowMat });

      const angle = (i / 4) * Math.PI * 2;
      orb.setLocalPosition(Math.cos(angle) * 0.7, 0.3, Math.sin(angle) * 0.7);
      orb.setLocalScale(0.1, 0.1, 0.1);

      entity.addChild(orb);
    }

    // Add floating ring
    const ringMat = new pc.StandardMaterial();
    ringMat.diffuse = color;
    ringMat.emissive = new pc.Color(color.r * 0.3, color.g * 0.3, color.b * 0.3);
    ringMat.opacity = 0.4;
    ringMat.blendType = pc.BLEND_ADDITIVE;
    ringMat.update();

    const ring = new pc.Entity('magic_ring');
    ring.addComponent('render', { type: 'torus', material: ringMat });
    ring.setLocalScale(1.2, 1.2, 0.1);
    ring.setLocalEulerAngles(90, 0, 0);
    ring.setLocalPosition(0, -0.2, 0);
    entity.addChild(ring);
  }

  /**
   * Create a magical orb for unknown words
   */
  private createMagicalOrb(keyword: string): pc.Entity {
    const entity = new pc.Entity(keyword);

    // Create colorful placeholder based on keyword hash
    const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % 5;

    // Predefined vibrant colors matching Nano Banana aesthetic
    const colorConfigs = [
      { diffuse: new pc.Color(1, 0.35, 0.4), emissive: new pc.Color(0.3, 0.08, 0.1) },    // Ruby
      { diffuse: new pc.Color(0.35, 0.85, 0.45), emissive: new pc.Color(0.08, 0.25, 0.1) }, // Emerald
      { diffuse: new pc.Color(0.35, 0.55, 1), emissive: new pc.Color(0.08, 0.12, 0.3) },   // Sapphire
      { diffuse: new pc.Color(1, 0.85, 0.25), emissive: new pc.Color(0.3, 0.22, 0.05) },   // Gold
      { diffuse: new pc.Color(0.85, 0.4, 1), emissive: new pc.Color(0.22, 0.1, 0.3) },     // Amethyst
    ];

    const config = colorConfigs[colorIndex];

    // Main orb
    const material = new pc.StandardMaterial();
    material.diffuse = config.diffuse;
    material.emissive = config.emissive;
    material.specular = new pc.Color(1, 1, 1);
    material.gloss = 0.95;
    material.metalness = 0.3;
    material.useMetalness = true;
    material.update();

    entity.addComponent('render', {
      type: 'sphere',
      material: material,
    });

    // Inner glow effect
    const glowEntity = new pc.Entity('glow');
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = config.diffuse;
    glowMat.emissive = config.diffuse;
    glowMat.emissiveIntensity = 0.5;
    glowMat.opacity = 0.3;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();

    glowEntity.addComponent('render', {
      type: 'sphere',
      material: glowMat,
    });
    glowEntity.setLocalScale(1.3, 1.3, 1.3);
    entity.addChild(glowEntity);

    // Floating ring
    const ringEntity = new pc.Entity('ring');
    const ringMat = new pc.StandardMaterial();
    ringMat.diffuse = new pc.Color(1, 1, 1);
    ringMat.emissive = config.emissive;
    ringMat.opacity = 0.5;
    ringMat.gloss = 0.9;
    ringMat.update();

    ringEntity.addComponent('render', {
      type: 'torus',
      material: ringMat,
    });
    ringEntity.setLocalScale(0.8, 0.8, 0.1);
    ringEntity.setLocalEulerAngles(90, 0, 0);
    entity.addChild(ringEntity);

    return entity;
  }

  /**
   * Check if API is available for 3D generation
   */
  isApiAvailable(): boolean {
    return API_AVAILABLE && !DEMO_MODE;
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
