/**
 * Obstacle Spawner
 * Spawns collectible words and obstacles in Word Ninja mode
 */

import * as pc from 'playcanvas';
import type { WordNinjaConfig } from '../scenes/WordNinjaScene';
import { WordModelGenerator } from './WordModelGenerator';

interface SpawnedItem {
  entity: pc.Entity;
  word: string;
  isCorrect: boolean;
  lane: number;
  zPosition: number;
  collected: boolean;
}

export interface CollectedItem {
  word: string;
  isCorrect: boolean;
}

// Word pool for distractors
const WORD_POOL = [
  'apple', 'banana', 'cat', 'dog', 'elephant',
  'star', 'heart', 'sun', 'moon', 'flower',
  'bird', 'fish', 'house', 'car', 'ball',
  'orange', 'grape', 'book', 'tree', 'strawberry',
];

export class ObstacleSpawner {
  private root: pc.Entity;
  private config: WordNinjaConfig;
  private modelGenerator: WordModelGenerator;
  
  private items: SpawnedItem[] = [];
  private targetWord = 'apple';
  private speed = 8;
  
  private spawnTimer = 0;
  private spawnInterval = 1.5;
  private minSpawnInterval = 0.8;
  
  private spawnDistance = -60;
  private despawnDistance = 10;
  
  private collectRadius = 1.2;
  private correctWordChance = 0.4; // 40% chance to spawn correct word

  constructor(root: pc.Entity, config: WordNinjaConfig) {
    this.root = root;
    this.config = config;
    this.modelGenerator = new WordModelGenerator();
  }

  /**
   * Set the target word to collect
   */
  setTargetWord(word: string): void {
    this.targetWord = word.toLowerCase();
    console.log(`[Spawner] Target word: ${this.targetWord}`);
  }

  /**
   * Set current speed
   */
  setSpeed(speed: number): void {
    this.speed = speed;
    // Adjust spawn rate based on speed
    this.spawnInterval = Math.max(this.minSpawnInterval, 2 - speed * 0.1);
  }

  /**
   * Reset spawner
   */
  reset(): void {
    // Remove all existing items
    for (const item of this.items) {
      item.entity.destroy();
    }
    this.items = [];
    this.spawnTimer = 0;
  }

  /**
   * Update spawner
   */
  update(dt: number): void {
    // Spawn new items
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnItem();
    }
    
    // Move and clean up items
    const toRemove: number[] = [];
    
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      
      // Move towards player
      item.zPosition += this.speed * dt;
      item.entity.setPosition(
        this.getLaneX(item.lane),
        item.entity.getPosition().y,
        item.zPosition
      );
      
      // Floating animation
      const floatY = 1.2 + Math.sin(Date.now() * 0.003 + i) * 0.15;
      const pos = item.entity.getPosition();
      item.entity.setPosition(pos.x, floatY, pos.z);
      
      // Rotation animation
      const rot = item.entity.getEulerAngles();
      item.entity.setEulerAngles(rot.x, rot.y + 60 * dt, rot.z);
      
      // Remove if past player
      if (item.zPosition > this.despawnDistance) {
        item.entity.destroy();
        toRemove.push(i);
      }
    }
    
    // Remove despawned items
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.items.splice(toRemove[i], 1);
    }
  }

  /**
   * Spawn a new item
   */
  private spawnItem(): void {
    // Decide which word to spawn
    const isCorrect = Math.random() < this.correctWordChance;
    const word = isCorrect ? this.targetWord : this.getRandomDistractor();
    
    // Random lane
    const lane = Math.floor(Math.random() * this.config.lanes);
    
    // Check if lane is blocked
    const blocked = this.items.some(item => 
      item.lane === lane && 
      Math.abs(item.zPosition - this.spawnDistance) < 5
    );
    
    if (blocked) return;
    
    // Create entity
    const entity = this.createWordEntity(word, isCorrect);
    entity.setPosition(this.getLaneX(lane), 1.2, this.spawnDistance);
    
    this.root.addChild(entity);
    
    this.items.push({
      entity,
      word,
      isCorrect,
      lane,
      zPosition: this.spawnDistance,
      collected: false,
    });
  }

  /**
   * Get a random distractor word
   */
  private getRandomDistractor(): string {
    const distractors = WORD_POOL.filter(w => w !== this.targetWord);
    return distractors[Math.floor(Math.random() * distractors.length)];
  }

  /**
   * Create a word entity
   */
  private createWordEntity(word: string, isCorrect: boolean): pc.Entity {
    const container = new pc.Entity(word);
    
    // Try to get procedural model
    let wordModel = this.modelGenerator.getModel(word);
    
    if (wordModel) {
      container.addChild(wordModel);
      wordModel.setLocalScale(1.5, 1.5, 1.5);
    } else {
      // Fallback to text orb
      wordModel = this.createTextOrb(word, isCorrect);
      container.addChild(wordModel);
    }
    
    // Add glow effect based on correct/wrong
    this.addGlowEffect(container, isCorrect);
    
    // Add floating platform
    const platform = this.createPlatform(isCorrect);
    platform.setPosition(0, -0.6, 0);
    container.addChild(platform);
    
    return container;
  }

  /**
   * Create a text orb for words without models
   */
  private createTextOrb(_word: string, isCorrect: boolean): pc.Entity {
    const orb = new pc.Entity('orb');
    
    const mat = new pc.StandardMaterial();
    mat.diffuse = isCorrect 
      ? new pc.Color(0.2, 0.9, 0.4) 
      : new pc.Color(0.9, 0.6, 0.2);
    mat.emissive = isCorrect
      ? new pc.Color(0.05, 0.2, 0.1)
      : new pc.Color(0.2, 0.15, 0.05);
    mat.gloss = 0.9;
    mat.metalness = 0.3;
    mat.useMetalness = true;
    mat.update();
    
    orb.addComponent('render', { type: 'sphere', material: mat });
    orb.setLocalScale(0.8, 0.8, 0.8);
    
    return orb;
  }

  /**
   * Add glow effect to container
   */
  private addGlowEffect(entity: pc.Entity, isCorrect: boolean): void {
    const glowMat = new pc.StandardMaterial();
    
    if (isCorrect) {
      glowMat.diffuse = new pc.Color(0.3, 1, 0.5);
      glowMat.emissive = new pc.Color(0.1, 0.4, 0.15);
    } else {
      glowMat.diffuse = new pc.Color(1, 0.7, 0.3);
      glowMat.emissive = new pc.Color(0.3, 0.2, 0.1);
    }
    
    glowMat.opacity = 0.25;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();
    
    const glow = new pc.Entity('glow');
    glow.addComponent('render', { type: 'sphere', material: glowMat });
    glow.setLocalScale(2, 2, 2);
    entity.addChild(glow);
    
    // Add sparkle particles
    for (let i = 0; i < 4; i++) {
      const sparkle = new pc.Entity(`sparkle_${i}`);
      sparkle.addComponent('render', { type: 'sphere', material: glowMat });
      sparkle.setLocalScale(0.15, 0.15, 0.15);
      
      const angle = (i / 4) * Math.PI * 2;
      sparkle.setPosition(Math.cos(angle) * 0.8, 0.3, Math.sin(angle) * 0.8);
      entity.addChild(sparkle);
    }
  }

  /**
   * Create floating platform under item
   */
  private createPlatform(isCorrect: boolean): pc.Entity {
    const platform = new pc.Entity('platform');
    
    const mat = new pc.StandardMaterial();
    mat.diffuse = isCorrect 
      ? new pc.Color(0.2, 0.5, 0.3)
      : new pc.Color(0.5, 0.35, 0.2);
    mat.gloss = 0.8;
    mat.metalness = 0.2;
    mat.useMetalness = true;
    mat.update();
    
    platform.addComponent('render', { type: 'cylinder', material: mat });
    platform.setLocalScale(1.2, 0.1, 1.2);
    
    // Add ring
    const ringMat = new pc.StandardMaterial();
    ringMat.diffuse = isCorrect 
      ? new pc.Color(0.5, 1, 0.6)
      : new pc.Color(1, 0.8, 0.4);
    ringMat.emissive = isCorrect
      ? new pc.Color(0.15, 0.3, 0.18)
      : new pc.Color(0.3, 0.24, 0.12);
    ringMat.update();
    
    const ring = new pc.Entity('ring');
    ring.addComponent('render', { type: 'torus', material: ringMat });
    ring.setLocalScale(1.4, 1.4, 0.15);
    ring.setLocalEulerAngles(90, 0, 0);
    platform.addChild(ring);
    
    return platform;
  }

  /**
   * Get X position for lane
   */
  private getLaneX(lane: number): number {
    const center = (this.config.lanes - 1) / 2;
    return (lane - center) * this.config.laneWidth;
  }

  /**
   * Check collisions with player position
   */
  checkCollisions(playerPos: pc.Vec3): CollectedItem[] {
    const collected: CollectedItem[] = [];
    
    for (const item of this.items) {
      if (item.collected) continue;
      
      const itemPos = item.entity.getPosition();
      const dx = itemPos.x - playerPos.x;
      const dz = itemPos.z - playerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < this.collectRadius) {
        item.collected = true;
        
        // Collect animation
        this.playCollectAnimation(item.entity, item.isCorrect);
        
        collected.push({
          word: item.word,
          isCorrect: item.isCorrect,
        });
      }
    }
    
    return collected;
  }

  /**
   * Play collection animation
   */
  private playCollectAnimation(entity: pc.Entity, isCorrect: boolean): void {
    // Quick scale up and fade out
    let time = 0;
    const duration = 0.3;
    const startScale = entity.getLocalScale().clone();
    const startY = entity.getPosition().y;
    
    const animate = () => {
      time += 0.016;
      const t = time / duration;
      
      if (t >= 1) {
        entity.destroy();
        return;
      }
      
      // Scale up
      const scale = 1 + t * (isCorrect ? 0.5 : 0.3);
      entity.setLocalScale(
        startScale.x * scale,
        startScale.y * scale,
        startScale.z * scale
      );
      
      // Move up if correct
      if (isCorrect) {
        const pos = entity.getPosition();
        entity.setPosition(pos.x, startY + t * 2, pos.z);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

export default ObstacleSpawner;
