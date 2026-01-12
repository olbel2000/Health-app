/**
 * Scene Manager
 * Handles scene transitions and lifecycle
 */

import * as pc from 'playcanvas';
import { Engine } from './Engine';

export abstract class Scene {
  protected engine: Engine;
  protected root: pc.Entity;
  public name: string;
  public isActive: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.engine = Engine.getInstance();
    this.root = this.engine.createEntity(`Scene_${name}`);
    this.root.enabled = false;
  }

  /**
   * Called when scene is entered
   */
  abstract onEnter(): Promise<void>;

  /**
   * Called every frame while active
   */
  abstract onUpdate(dt: number): void;

  /**
   * Called when scene is exited
   */
  abstract onExit(): Promise<void>;

  /**
   * Activate the scene
   */
  async activate(): Promise<void> {
    console.log(`[Scene] Activating: ${this.name}`);
    this.root.enabled = true;
    this.isActive = true;
    await this.onEnter();
  }

  /**
   * Deactivate the scene
   */
  async deactivate(): Promise<void> {
    console.log(`[Scene] Deactivating: ${this.name}`);
    await this.onExit();
    this.root.enabled = false;
    this.isActive = false;
  }

  /**
   * Destroy the scene
   */
  destroy(): void {
    this.root.destroy();
  }
}

export class SceneManager {
  private static instance: SceneManager | null = null;
  
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private engine: Engine;

  private constructor() {
    this.engine = Engine.getInstance();
    
    // Register update loop
    this.engine.app.on('update', (dt: number) => {
      if (this.currentScene?.isActive) {
        this.currentScene.onUpdate(dt);
      }
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  /**
   * Register a scene
   */
  register(scene: Scene): void {
    this.scenes.set(scene.name, scene);
    console.log(`[SceneManager] Registered: ${scene.name}`);
  }

  /**
   * Switch to a scene
   */
  async switchTo(sceneName: string): Promise<void> {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      throw new Error(`Scene not found: ${sceneName}`);
    }

    // Deactivate current scene
    if (this.currentScene) {
      await this.currentScene.deactivate();
    }

    // Activate new scene
    this.currentScene = newScene;
    await this.currentScene.activate();
  }

  /**
   * Get current scene
   */
  getCurrent(): Scene | null {
    return this.currentScene;
  }

  /**
   * Get scene by name
   */
  get(sceneName: string): Scene | undefined {
    return this.scenes.get(sceneName);
  }

  /**
   * Check if scene exists
   */
  has(sceneName: string): boolean {
    return this.scenes.has(sceneName);
  }

  /**
   * Destroy all scenes
   */
  destroyAll(): void {
    for (const scene of this.scenes.values()) {
      scene.destroy();
    }
    this.scenes.clear();
    this.currentScene = null;
  }
}

export default SceneManager;
