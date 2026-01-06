/**
 * Lingo Island - Type Definitions
 */

import * as pc from 'playcanvas';

// ============================================
// Game State Types
// ============================================

export type GameState = 'loading' | 'menu' | 'character-select' | 'playing' | 'paused';

export type CharacterType = 'ladybug' | 'harry';

export type GameModule = 'word-ninja' | 'magic-tracing' | 'voice-spell';

export interface GameProgress {
  score: number;
  streak: number;
  wordsLearned: string[];
  currentLevel: number;
  selectedCharacter: CharacterType | null;
}

// ============================================
// Word/Asset Types
// ============================================

export type AssetStyle = 
  | 'nano-banana'
  | 'vinyl-toy'
  | 'metallic-gloss'
  | 'cartoon-3d'
  | 'low-poly';

export interface WordData {
  keyword: string;
  translation?: string;
  hint?: string;
  category?: string;
  difficulty?: number;
}

export interface Asset3DResponse {
  success: boolean;
  keyword: string;
  style: string;
  url: string;
  cached: boolean;
  message?: string;
}

// ============================================
// Scene Types
// ============================================

export interface SceneConfig {
  name: string;
  skybox?: string;
  ambientLight?: pc.Color;
  fogEnabled?: boolean;
  fogColor?: pc.Color;
  fogDensity?: number;
}

export interface IslandConfig {
  baseRadius: number;
  segments: number;
  heightVariation: number;
  waterLevel: number;
}

// ============================================
// Entity Types
// ============================================

export interface CharacterConfig {
  type: CharacterType;
  modelUrl?: string;
  scale: number;
  speed: number;
  jumpForce: number;
  abilities: string[];
}

export interface CollectibleConfig {
  keyword: string;
  modelUrl: string;
  position: pc.Vec3;
  rotation?: pc.Vec3;
  scale?: number;
  points: number;
}

// ============================================
// UI Types
// ============================================

export interface UIElements {
  loadingScreen: HTMLElement;
  gameUI: HTMLElement;
  scoreValue: HTMLElement;
  streakValue: HTMLElement;
  wordDisplay: HTMLElement;
  currentWord: HTMLElement;
  currentHint: HTMLElement;
  characterSelect: HTMLElement;
  btnHint: HTMLButtonElement;
  btnMic: HTMLButtonElement;
  btnSkip: HTMLButtonElement;
}

// ============================================
// Event Types
// ============================================

export interface GameEvents {
  'state:change': { from: GameState; to: GameState };
  'score:update': { score: number; delta: number };
  'streak:update': { streak: number };
  'word:complete': { word: string; correct: boolean };
  'character:select': { character: CharacterType };
  'asset:loaded': { keyword: string; entity: pc.Entity };
  'speech:result': { transcript: string; confidence: number };
}

export type GameEventHandler<K extends keyof GameEvents> = (data: GameEvents[K]) => void;

// ============================================
// Service Types
// ============================================

export interface MiddlewareConfig {
  baseUrl: string;
  defaultStyle: AssetStyle;
  timeout: number;
}

export interface AssetCacheEntry {
  keyword: string;
  style: AssetStyle;
  asset: pc.Asset;
  entity?: pc.Entity;
  loadedAt: number;
}
