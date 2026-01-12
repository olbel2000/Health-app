/**
 * Word Ninja Scene - Module A
 * 3D Runner mechanics for Nano Ladybug
 * Swipe to collect correct words, avoid wrong ones!
 */

import * as pc from 'playcanvas';
import { Scene } from '../core/SceneManager';
import { Engine } from '../core/Engine';
import { RunnerController } from '../entities/RunnerController';
import { ObstacleSpawner } from '../entities/ObstacleSpawner';
import { SwipeControls } from '../services/SwipeControls';

export interface WordNinjaConfig {
  targetWord: string;
  speed: number;
  lanes: number;
  laneWidth: number;
}

const DEFAULT_CONFIG: WordNinjaConfig = {
  targetWord: 'apple',
  speed: 8,
  lanes: 3,
  laneWidth: 2.5,
};

export class WordNinjaScene extends Scene {
  private config: WordNinjaConfig;
  private runner: RunnerController | null = null;
  private spawner: ObstacleSpawner | null = null;
  private controls: SwipeControls | null = null;
  private camera: pc.Entity | null = null;
  
  private ground: pc.Entity | null = null;
  private groundSegments: pc.Entity[] = [];
  private segmentLength = 30;
  private totalSegments = 4;
  
  private score = 0;
  private lives = 3;
  private isPlaying = false;
  private gameTime = 0;

  constructor(config: Partial<WordNinjaConfig> = {}) {
    super('word-ninja');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async onEnter(): Promise<void> {
    console.log('[WordNinja] Loading scene...');
    
    this.setupSkybox();
    this.setupLighting();
    this.createRunningTrack();
    this.createSideDecorations();
    this.setupCamera();
    
    // Initialize systems
    this.runner = new RunnerController(this.root, this.config);
    this.spawner = new ObstacleSpawner(this.root, this.config);
    this.controls = new SwipeControls();
    
    // Connect controls to runner
    this.controls.onSwipe((direction) => {
      if (this.isPlaying && this.runner) {
        this.runner.changeLane(direction);
      }
    });

    console.log('[WordNinja] Scene loaded!');
  }

  /**
   * Called every frame
   */
  onUpdate(dt: number): void {
    this.update(dt);
  }

  /**
   * Called when scene exits
   */
  async onExit(): Promise<void> {
    if (this.controls) {
      this.controls.destroy();
      this.controls = null;
    }
    
    this.groundSegments = [];
    this.isPlaying = false;
    console.log('[WordNinja] Scene unloaded');
  }

  /**
   * Start the game with a target word
   */
  startGame(targetWord: string): void {
    this.config.targetWord = targetWord;
    this.score = 0;
    this.lives = 3;
    this.gameTime = 0;
    this.isPlaying = true;
    
    if (this.spawner) {
      this.spawner.setTargetWord(targetWord);
      this.spawner.reset();
    }
    
    if (this.runner) {
      this.runner.reset();
    }
    
    this.updateUI();
    console.log(`[WordNinja] Game started! Target: ${targetWord}`);
  }

  /**
   * Stop the game
   */
  stopGame(): void {
    this.isPlaying = false;
    console.log(`[WordNinja] Game stopped. Score: ${this.score}`);
  }

  update(dt: number): void {
    if (!this.isPlaying) return;
    
    this.gameTime += dt;
    
    // Update ground scrolling
    this.updateGround(dt);
    
    // Update runner
    if (this.runner) {
      this.runner.update(dt);
    }
    
    // Update spawner and check collisions
    if (this.spawner && this.runner) {
      this.spawner.update(dt);
      
      // Check collisions
      const collected = this.spawner.checkCollisions(this.runner.getPosition());
      
      for (const item of collected) {
        if (item.isCorrect) {
          this.onCorrectWord(item.word);
        } else {
          this.onWrongWord(item.word);
        }
      }
    }
    
    // Gradually increase speed
    if (this.spawner) {
      const speedBonus = Math.floor(this.gameTime / 10) * 0.5;
      this.spawner.setSpeed(this.config.speed + speedBonus);
    }
  }

  /**
   * Handle correct word collection
   */
  private onCorrectWord(word: string): void {
    this.score += 100;
    this.updateUI();
    this.showCollectEffect(true);
    console.log(`[WordNinja] Correct! +100 (${word})`);
    
    // Trigger celebration
    const engine = Engine.getInstance();
    engine.addScore(100);
    engine.incrementStreak();
  }

  /**
   * Handle wrong word collection
   */
  private onWrongWord(word: string): void {
    this.lives--;
    this.updateUI();
    this.showCollectEffect(false);
    console.log(`[WordNinja] Wrong! Lives: ${this.lives} (${word})`);
    
    if (this.lives <= 0) {
      this.onGameOver();
    } else {
      // Reset streak
      const engine = Engine.getInstance();
      engine.resetStreak();
    }
  }

  /**
   * Handle game over
   */
  private onGameOver(): void {
    this.isPlaying = false;
    console.log(`[WordNinja] Game Over! Final score: ${this.score}`);
    
    // Dispatch event
    const event = new CustomEvent('wordninja:gameover', {
      detail: { score: this.score, word: this.config.targetWord }
    });
    window.dispatchEvent(event);
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const livesEl = document.getElementById('ninja-lives');
    const scoreEl = document.getElementById('ninja-score');
    const targetEl = document.getElementById('ninja-target');
    
    if (livesEl) livesEl.textContent = '❤️'.repeat(this.lives);
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
    if (targetEl) targetEl.textContent = `Collect: ${this.config.targetWord.toUpperCase()}`;
  }

  /**
   * Show visual effect for collection
   */
  private showCollectEffect(isCorrect: boolean): void {
    const flash = document.createElement('div');
    flash.className = `ninja-flash ${isCorrect ? 'correct' : 'wrong'}`;
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 300);
  }

  /**
   * Setup skybox with gradient
   */
  private setupSkybox(): void {
    const app = this.engine.app;
    
    // Sunset/action sky colors
    app.scene.ambientLight = new pc.Color(0.4, 0.35, 0.5);
    
    // Try PlayCanvas 2.x API
    const sceneAny = app.scene as any;
    if (sceneAny.rendering) {
      sceneAny.rendering.fog = pc.FOG_LINEAR;
      sceneAny.rendering.fogColor = new pc.Color(0.95, 0.6, 0.4);
      sceneAny.rendering.fogStart = 30;
      sceneAny.rendering.fogEnd = 80;
    } else {
      // Fallback to 1.x API
      sceneAny.fog = pc.FOG_LINEAR;
      sceneAny.fogColor = new pc.Color(0.95, 0.6, 0.4);
      sceneAny.fogStart = 30;
      sceneAny.fogEnd = 80;
    }
  }

  /**
   * Setup dramatic lighting
   */
  private setupLighting(): void {
    // Main sun
    const sun = new pc.Entity('sun');
    sun.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.9, 0.7),
      intensity: 1.2,
      castShadows: true,
      shadowBias: 0.05,
      shadowDistance: 50,
      shadowResolution: 2048,
    });
    sun.setEulerAngles(45, -30, 0);
    this.root.addChild(sun);

    // Rim light
    const rim = new pc.Entity('rim');
    rim.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.5, 0.3),
      intensity: 0.4,
    });
    rim.setEulerAngles(-20, 150, 0);
    this.root.addChild(rim);

    // Fill light
    const fill = new pc.Entity('fill');
    fill.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.5, 0.6, 1),
      intensity: 0.3,
    });
    fill.setEulerAngles(30, 90, 0);
    this.root.addChild(fill);
  }

  /**
   * Create infinite running track
   */
  private createRunningTrack(): void {
    this.ground = new pc.Entity('ground');
    
    for (let i = 0; i < this.totalSegments; i++) {
      const segment = this.createGroundSegment(i);
      segment.setPosition(0, 0, -i * this.segmentLength);
      this.ground.addChild(segment);
      this.groundSegments.push(segment);
    }
    
    this.root.addChild(this.ground);
  }

  /**
   * Create a single ground segment
   */
  private createGroundSegment(index: number): pc.Entity {
    const segment = new pc.Entity(`ground_${index}`);
    const trackWidth = this.config.laneWidth * this.config.lanes + 2;
    
    // Main track
    const trackMat = new pc.StandardMaterial();
    trackMat.diffuse = new pc.Color(0.25, 0.25, 0.35);
    trackMat.specular = new pc.Color(0.3, 0.3, 0.4);
    trackMat.gloss = 0.7;
    trackMat.update();
    
    const track = new pc.Entity('track');
    track.addComponent('render', { type: 'box', material: trackMat });
    track.setLocalScale(trackWidth, 0.3, this.segmentLength);
    track.setPosition(0, -0.15, 0);
    segment.addChild(track);
    
    // Lane dividers
    const dividerMat = new pc.StandardMaterial();
    dividerMat.diffuse = new pc.Color(1, 0.8, 0.2);
    dividerMat.emissive = new pc.Color(0.3, 0.24, 0.05);
    dividerMat.update();
    
    for (let lane = 0; lane < this.config.lanes - 1; lane++) {
      const x = (lane - (this.config.lanes - 2) / 2) * this.config.laneWidth;
      
      // Dashed lines
      for (let dash = 0; dash < 5; dash++) {
        const divider = new pc.Entity(`divider_${lane}_${dash}`);
        divider.addComponent('render', { type: 'box', material: dividerMat });
        divider.setLocalScale(0.15, 0.02, 2);
        divider.setPosition(x, 0.01, -dash * 6 + this.segmentLength / 2 - 3);
        segment.addChild(divider);
      }
    }
    
    // Side rails
    const railMat = new pc.StandardMaterial();
    railMat.diffuse = new pc.Color(0.8, 0.2, 0.3);
    railMat.emissive = new pc.Color(0.2, 0.05, 0.08);
    railMat.gloss = 0.9;
    railMat.update();
    
    [-1, 1].forEach(side => {
      const rail = new pc.Entity(`rail_${side}`);
      rail.addComponent('render', { type: 'box', material: railMat });
      rail.setLocalScale(0.3, 0.5, this.segmentLength);
      rail.setPosition(side * (trackWidth / 2 + 0.15), 0.25, 0);
      segment.addChild(rail);
    });

    return segment;
  }

  /**
   * Update ground scrolling (infinite track effect)
   */
  private updateGround(dt: number): void {
    const speed = this.config.speed + Math.floor(this.gameTime / 10) * 0.5;
    
    for (const segment of this.groundSegments) {
      const pos = segment.getPosition();
      pos.z += speed * dt;
      
      // Reset segment when it passes the player
      if (pos.z > this.segmentLength) {
        pos.z -= this.totalSegments * this.segmentLength;
      }
      
      segment.setPosition(pos);
    }
  }

  /**
   * Create side decorations (buildings, etc)
   */
  private createSideDecorations(): void {
    const buildingColors = [
      new pc.Color(0.7, 0.4, 0.5),
      new pc.Color(0.4, 0.5, 0.7),
      new pc.Color(0.5, 0.7, 0.5),
      new pc.Color(0.7, 0.6, 0.4),
    ];
    
    for (let i = 0; i < 20; i++) {
      [-1, 1].forEach(side => {
        const building = new pc.Entity(`building_${side}_${i}`);
        
        const mat = new pc.StandardMaterial();
        mat.diffuse = buildingColors[Math.floor(Math.random() * buildingColors.length)];
        mat.gloss = 0.6;
        mat.update();
        
        building.addComponent('render', { type: 'box', material: mat });
        
        const height = 3 + Math.random() * 8;
        const width = 2 + Math.random() * 3;
        const depth = 2 + Math.random() * 3;
        
        building.setLocalScale(width, height, depth);
        building.setPosition(
          side * (8 + Math.random() * 4),
          height / 2,
          -i * 8 - Math.random() * 4
        );
        
        this.root.addChild(building);
      });
    }
  }

  /**
   * Setup camera for runner view
   */
  private setupCamera(): void {
    // Create camera entity
    this.camera = this.engine.createEntity('NinjaCamera', this.root);
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.3, 0.2, 0.3),
      fov: 60,
      nearClip: 0.1,
      farClip: 200,
    });
    
    // Behind-the-player view
    this.camera.setPosition(0, 4, 8);
    this.camera.setEulerAngles(-15, 0, 0);
  }
}

export default WordNinjaScene;
