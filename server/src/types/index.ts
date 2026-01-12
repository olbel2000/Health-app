/**
 * Lingo Island Middleware - Type Definitions
 */

// ============================================
// Database Types
// ============================================

export interface AssetRecord {
  id: number;
  keyword: string;
  style: string;
  local_url: string;
  meshy_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetInsert {
  keyword: string;
  style: string;
  local_url: string;
  meshy_task_id?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface Get3DModelRequest {
  keyword: string;
  style?: AssetStyle;
}

export interface Get3DModelResponse {
  success: boolean;
  keyword: string;
  style: string;
  url: string;
  cached: boolean;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================
// Meshy.ai API Types
// ============================================

export type AssetStyle = 
  | 'nano-banana'      // High-gloss claymorphism
  | 'vinyl-toy'        // Soft vinyl finish
  | 'metallic-gloss'   // Metallic/glossy finish
  | 'cartoon-3d'       // Cartoon style
  | 'low-poly';        // Low-poly stylized

export interface MeshyTextTo3DRequest {
  mode: 'preview' | 'refine';
  prompt: string;
  art_style: string;
  negative_prompt?: string;
  ai_model?: string;
  topology?: 'quad' | 'triangle';
  target_polycount?: number;
}

export interface MeshyTaskResponse {
  result: string;
  id: string;
}

export interface MeshyTaskStatus {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  progress: number;
  model_urls?: {
    glb: string;
    fbx?: string;
    usdz?: string;
    obj?: string;
  };
  texture_urls?: {
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  }[];
  thumbnail_url?: string;
  created_at: number;
  finished_at?: number;
  task_error?: {
    message: string;
  };
}

// ============================================
// Service Types
// ============================================

export interface GenerateAssetOptions {
  keyword: string;
  style: AssetStyle;
  forceRegenerate?: boolean;
}

export interface GenerateAssetResult {
  success: boolean;
  localUrl: string;
  meshyTaskId?: string;
  cached: boolean;
  error?: string;
}

// ============================================
// Style Configuration
// ============================================

export interface StyleConfig {
  name: AssetStyle;
  promptModifier: string;
  negativePrompt: string;
  artStyle: string;
}

export const STYLE_CONFIGS: Record<AssetStyle, StyleConfig> = {
  'nano-banana': {
    name: 'nano-banana',
    promptModifier: 'high-gloss vinyl toy, claymorphism style, puffy rounded forms, collectible figure, PBR materials, studio lighting',
    negativePrompt: 'realistic, matte, flat shading, low quality, blurry',
    artStyle: 'cartoon'
  },
  'vinyl-toy': {
    name: 'vinyl-toy',
    promptModifier: 'soft-touch vinyl toy finish, designer toy aesthetic, smooth surfaces, pastel colors, collectible figurine',
    negativePrompt: 'realistic, rough texture, sharp edges, dark colors',
    artStyle: 'cartoon'
  },
  'metallic-gloss': {
    name: 'metallic-gloss',
    promptModifier: 'metallic glossy finish, chrome accents, reflective surfaces, action figure style, premium collectible',
    negativePrompt: 'matte, dull, plastic, cheap looking',
    artStyle: 'cartoon'
  },
  'cartoon-3d': {
    name: 'cartoon-3d',
    promptModifier: '3D cartoon style, vibrant colors, stylized proportions, kid-friendly, animated movie quality',
    negativePrompt: 'realistic, photorealistic, dark, scary',
    artStyle: 'cartoon'
  },
  'low-poly': {
    name: 'low-poly',
    promptModifier: 'low-poly stylized, geometric shapes, faceted surfaces, mobile game ready, optimized mesh',
    negativePrompt: 'high detail, realistic, organic shapes',
    artStyle: 'low-poly'
  }
};
