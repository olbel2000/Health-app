/**
 * PlayCanvas Engine Wrapper
 * Manages the core PlayCanvas application lifecycle
 */

import * as pc from 'playcanvas';
import type { GameState, GameProgress, UIElements, CharacterType } from '../types';

export class Engine {
  private static instance: Engine | null = null;
  
  public app: pc.Application;
  public canvas: HTMLCanvasElement;
  public root: pc.Entity;
  
  private _state: GameState = 'loading';
  private _progress: GameProgress;
  private _ui: UIElements;

  private constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize PlayCanvas Application
    this.app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: false,
        preferWebGl2: true,
        powerPreference: 'high-performance',
      },
    });

    // Configure application
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    
    // Enable high quality rendering (configured per-camera in scenes)
    
    // Get root entity
    this.root = this.app.root;

    // Initialize progress
    this._progress = {
      score: 0,
      streak: 0,
      wordsLearned: [],
      currentLevel: 1,
      selectedCharacter: null,
    };

    // Cache UI elements
    this._ui = this.cacheUIElements();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.app.resizeCanvas();
    });

    // Start the application
    this.app.start();
    
    console.log('[Engine] PlayCanvas initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(canvas?: HTMLCanvasElement): Engine {
    if (!Engine.instance) {
      if (!canvas) {
        throw new Error('Canvas required for first initialization');
      }
      Engine.instance = new Engine(canvas);
    }
    return Engine.instance;
  }

  /**
   * Cache DOM UI elements
   */
  private cacheUIElements(): UIElements {
    return {
      loadingScreen: document.getElementById('loading-screen')!,
      gameUI: document.getElementById('game-ui')!,
      scoreValue: document.getElementById('score-value')!,
      streakValue: document.getElementById('streak-value')!,
      wordDisplay: document.getElementById('word-display')!,
      currentWord: document.getElementById('current-word')!,
      currentHint: document.getElementById('current-hint')!,
      characterSelect: document.getElementById('character-select')!,
      btnHint: document.getElementById('btn-hint') as HTMLButtonElement,
      btnMic: document.getElementById('btn-mic') as HTMLButtonElement,
      btnSkip: document.getElementById('btn-skip') as HTMLButtonElement,
    };
  }

  /**
   * Get current game state
   */
  get state(): GameState {
    return this._state;
  }

  /**
   * Set game state with UI updates
   */
  set state(newState: GameState) {
    const oldState = this._state;
    this._state = newState;
    this.onStateChange(oldState, newState);
  }

  /**
   * Handle state transitions
   */
  private onStateChange(from: GameState, to: GameState): void {
    console.log(`[Engine] State: ${from} -> ${to}`);

    switch (to) {
      case 'loading':
        this._ui.loadingScreen.classList.remove('hidden');
        this._ui.gameUI.style.display = 'none';
        break;

      case 'menu':
      case 'character-select':
        this._ui.loadingScreen.classList.add('hidden');
        this._ui.gameUI.style.display = 'block';
        this._ui.characterSelect.classList.add('active');
        this._ui.wordDisplay.style.display = 'none';
        break;

      case 'playing':
        this._ui.loadingScreen.classList.add('hidden');
        this._ui.gameUI.style.display = 'block';
        this._ui.characterSelect.classList.remove('active');
        this._ui.wordDisplay.style.display = 'block';
        break;

      case 'paused':
        // Keep UI visible but could show pause overlay
        break;
    }
  }

  /**
   * Get game progress
   */
  get progress(): GameProgress {
    return this._progress;
  }

  /**
   * Get UI elements
   */
  get ui(): UIElements {
    return this._ui;
  }

  /**
   * Update score
   */
  addScore(points: number): void {
    this._progress.score += points;
    this._ui.scoreValue.textContent = this._progress.score.toString();
  }

  /**
   * Update streak
   */
  setStreak(streak: number): void {
    this._progress.streak = streak;
    this._ui.streakValue.textContent = streak.toString();
  }

  /**
   * Increment streak
   */
  incrementStreak(): void {
    this.setStreak(this._progress.streak + 1);
  }

  /**
   * Reset streak
   */
  resetStreak(): void {
    this.setStreak(0);
  }

  /**
   * Set selected character
   */
  selectCharacter(character: CharacterType): void {
    this._progress.selectedCharacter = character;
    console.log(`[Engine] Character selected: ${character}`);
  }

  /**
   * Add learned word
   */
  addLearnedWord(word: string): void {
    if (!this._progress.wordsLearned.includes(word)) {
      this._progress.wordsLearned.push(word);
    }
  }

  /**
   * Update loading progress
   */
  setLoadingProgress(message: string): void {
    const progressEl = document.querySelector('.loading-progress');
    if (progressEl) {
      progressEl.textContent = message;
    }
  }

  /**
   * Display current word
   */
  showWord(word: string, hint?: string): void {
    this._ui.currentWord.textContent = word.toUpperCase();
    this._ui.currentHint.textContent = hint || '';
    this._ui.wordDisplay.style.display = 'block';
  }

  /**
   * Hide word display
   */
  hideWord(): void {
    this._ui.wordDisplay.style.display = 'none';
  }

  /**
   * Create a basic entity
   */
  createEntity(name: string, parent?: pc.Entity): pc.Entity {
    const entity = new pc.Entity(name);
    (parent || this.root).addChild(entity);
    return entity;
  }

  /**
   * Destroy the engine
   */
  destroy(): void {
    this.app.destroy();
    Engine.instance = null;
  }
}

export default Engine;
