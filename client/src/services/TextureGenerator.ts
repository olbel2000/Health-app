/**
 * Procedural Texture Generator
 * Creates stylized textures for the "Nano Banana" aesthetic
 */

import * as pc from 'playcanvas';
import { Engine } from '../core/Engine';

export class TextureGenerator {
  private static instance: TextureGenerator | null = null;
  private engine: Engine;
  private textureCache: Map<string, pc.Texture> = new Map();

  private constructor() {
    this.engine = Engine.getInstance();
  }

  static getInstance(): TextureGenerator {
    if (!TextureGenerator.instance) {
      TextureGenerator.instance = new TextureGenerator();
    }
    return TextureGenerator.instance;
  }

  /**
   * Create a gradient texture
   */
  createGradientTexture(
    name: string,
    colors: Array<{ pos: number; color: [number, number, number, number] }>,
    width: number = 256,
    height: number = 256,
    vertical: boolean = true
  ): pc.Texture {
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const gradient = vertical
      ? ctx.createLinearGradient(0, 0, 0, height)
      : ctx.createLinearGradient(0, 0, width, 0);

    colors.forEach(({ pos, color }) => {
      gradient.addColorStop(pos, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width,
      height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create a noise texture for stylized surfaces
   */
  createNoiseTexture(
    name: string,
    baseColor: [number, number, number],
    noiseIntensity: number = 0.1,
    width: number = 256,
    height: number = 256
  ): pc.Texture {
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 2 * noiseIntensity * 255;
      data[i] = Math.max(0, Math.min(255, baseColor[0] + noise));
      data[i + 1] = Math.max(0, Math.min(255, baseColor[1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, baseColor[2] + noise));
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width,
      height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create a grass/ground texture with stylized pattern
   */
  createGrassTexture(): pc.Texture {
    const name = 'grass_stylized';
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base green gradient
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, '#5cb85c');
    gradient.addColorStop(0.5, '#4caf50');
    gradient.addColorStop(1, '#388e3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add grass blade patterns
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 10 + Math.random() * 20;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Add some lighter spots
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 5 + Math.random() * 15;
      
      ctx.fillStyle = `rgba(139, 195, 74, ${0.2 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 8,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create a water texture with animated feel
   */
  createWaterTexture(): pc.Texture {
    const name = 'water_stylized';
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base water gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1e88e5');
    gradient.addColorStop(0.3, '#42a5f5');
    gradient.addColorStop(0.6, '#1976d2');
    gradient.addColorStop(1, '#0d47a1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add wave patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    
    for (let y = 0; y < size; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < size; x += 5) {
        const wave = Math.sin((x + y) * 0.05) * 5;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Add sparkle highlights
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1 + Math.random() * 3;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 8,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create a rock/stone texture
   */
  createRockTexture(): pc.Texture {
    const name = 'rock_stylized';
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base purple-gray gradient
    const gradient = ctx.createRadialGradient(size/2, size/3, 0, size/2, size/2, size);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(0.4, '#5e35b1');
    gradient.addColorStop(1, '#4527a0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add stone texture noise
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Add cracks/details
    ctx.strokeStyle = 'rgba(69, 39, 160, 0.5)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 15; i++) {
      const x1 = Math.random() * size;
      const y1 = Math.random() * size;
      const x2 = x1 + (Math.random() - 0.5) * 60;
      const y2 = y1 + (Math.random() - 0.5) * 60;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create bark/wood texture for trees
   */
  createBarkTexture(): pc.Texture {
    const name = 'bark_stylized';
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base brown
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, 0, size, size);

    // Add vertical bark lines
    for (let x = 0; x < size; x += 8) {
      const offset = Math.random() * 4;
      ctx.strokeStyle = `rgba(78, 52, 46, ${0.3 + Math.random() * 0.4})`;
      ctx.lineWidth = 2 + Math.random() * 3;
      
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      
      for (let y = 0; y < size; y += 10) {
        const wobble = (Math.random() - 0.5) * 4;
        ctx.lineTo(x + offset + wobble, y);
      }
      ctx.stroke();
    }

    // Add knots
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      
      ctx.fillStyle = 'rgba(62, 39, 35, 0.6)';
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + Math.random() * 8, 12 + Math.random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create foliage/leaves texture
   */
  createFoliageTexture(): pc.Texture {
    const name = 'foliage_stylized';
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base green with radial gradient
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, '#81c784');
    gradient.addColorStop(0.5, '#66bb6a');
    gradient.addColorStop(1, '#4caf50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add leaf-like patterns
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const leafSize = 5 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      ctx.fillStyle = `rgba(${100 + Math.random() * 40}, ${180 + Math.random() * 40}, ${100 + Math.random() * 40}, 0.6)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, leafSize, leafSize / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Create a crystal/gem texture
   */
  createCrystalTexture(hue: number = 200): pc.Texture {
    const name = `crystal_${hue}`;
    const cached = this.textureCache.get(name);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Gradient based on hue
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, `hsl(${hue}, 80%, 70%)`);
    gradient.addColorStop(0.5, `hsl(${hue}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue}, 60%, 30%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add facet lines
    ctx.strokeStyle = `hsla(${hue}, 90%, 80%, 0.5)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      const angle = (i / 8) * Math.PI * 2;
      ctx.lineTo(size / 2 + Math.cos(angle) * size, size / 2 + Math.sin(angle) * size);
      ctx.stroke();
    }

    // Add highlight
    const highlight = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.3, size * 0.3, size * 0.3);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, size, size);

    const texture = new pc.Texture(this.engine.app.graphicsDevice, {
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      anisotropy: 4,
    });

    texture.setSource(canvas);
    texture.name = name;

    this.textureCache.set(name, texture);
    return texture;
  }

  /**
   * Clear texture cache
   */
  clearCache(): void {
    this.textureCache.forEach(texture => texture.destroy());
    this.textureCache.clear();
  }
}

export default TextureGenerator;
