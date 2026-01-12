/**
 * Character Controller
 * Base class for Nano Ladybug and Nano Harry Potter
 */

import * as pc from 'playcanvas';
import { Engine } from '../core/Engine';
import type { CharacterType, CharacterConfig } from '../types';

const CHARACTER_CONFIGS: Record<CharacterType, CharacterConfig> = {
  ladybug: {
    type: 'ladybug',
    scale: 1,
    speed: 8,
    jumpForce: 10,
    abilities: ['dash', 'double-jump'],
  },
  harry: {
    type: 'harry',
    scale: 1,
    speed: 5,
    jumpForce: 8,
    abilities: ['trace-spell', 'levitate'],
  },
};

export class Character {
  public entity: pc.Entity;
  public config: CharacterConfig;
  
  protected engine: Engine;
  protected velocity: pc.Vec3 = new pc.Vec3();
  protected isGrounded: boolean = true;
  protected canJump: boolean = true;

  constructor(type: CharacterType, parent?: pc.Entity) {
    this.engine = Engine.getInstance();
    this.config = CHARACTER_CONFIGS[type];
    
    // Create entity
    this.entity = this.engine.createEntity(`Character_${type}`, parent);
    
    // Build character mesh
    this.buildMesh();
    
    console.log(`[Character] Created: ${type}`);
  }

  /**
   * Build character mesh (placeholder - will be replaced with GLB)
   */
  protected buildMesh(): void {
    const isLadybug = this.config.type === 'ladybug';
    
    // Create glossy material
    const material = new pc.StandardMaterial();
    material.diffuse = isLadybug 
      ? new pc.Color(1, 0.2, 0.2) 
      : new pc.Color(0.3, 0.2, 0.5);
    material.specular = new pc.Color(1, 1, 1);
    material.gloss = 0.95;
    material.metalness = isLadybug ? 0.3 : 0.1;
    material.update();

    // Body
    const body = this.engine.createEntity('Body', this.entity);
    body.addComponent('render', {
      type: 'capsule',
      material: material,
    });
    body.setLocalScale(0.5, 0.7, 0.5);
    body.setPosition(0, 0.35, 0);

    // Head
    const head = this.engine.createEntity('Head', this.entity);
    head.addComponent('render', {
      type: 'sphere',
      material: material,
    });
    head.setLocalScale(0.4, 0.4, 0.4);
    head.setPosition(0, 0.9, 0);

    // Character-specific details
    if (isLadybug) {
      this.addLadybugDetails();
    } else {
      this.addHarryDetails();
    }
  }

  /**
   * Add Ladybug-specific details
   */
  private addLadybugDetails(): void {
    // Spots
    const spotMaterial = new pc.StandardMaterial();
    spotMaterial.diffuse = new pc.Color(0.1, 0.1, 0.1);
    spotMaterial.gloss = 0.9;
    spotMaterial.update();

    const spotPositions = [
      { x: 0.15, y: 0.4, z: 0.2 },
      { x: -0.15, y: 0.3, z: 0.2 },
      { x: 0, y: 0.5, z: 0.22 },
    ];

    spotPositions.forEach((pos, i) => {
      const spot = this.engine.createEntity(`Spot_${i}`, this.entity);
      spot.addComponent('render', {
        type: 'sphere',
        material: spotMaterial,
      });
      spot.setLocalScale(0.1, 0.1, 0.05);
      spot.setPosition(pos.x, pos.y, pos.z);
    });

    // Antennae
    const antennaMaterial = new pc.StandardMaterial();
    antennaMaterial.diffuse = new pc.Color(0.1, 0.1, 0.1);
    antennaMaterial.gloss = 0.8;
    antennaMaterial.update();

    [-0.1, 0.1].forEach((xOffset, i) => {
      const antenna = this.engine.createEntity(`Antenna_${i}`, this.entity);
      antenna.addComponent('render', {
        type: 'cylinder',
        material: antennaMaterial,
      });
      antenna.setLocalScale(0.03, 0.15, 0.03);
      antenna.setPosition(xOffset, 1.1, 0);
      antenna.setEulerAngles(0, 0, xOffset > 0 ? -20 : 20);
    });
  }

  /**
   * Add Harry-specific details
   */
  private addHarryDetails(): void {
    // Glasses
    const glassMaterial = new pc.StandardMaterial();
    glassMaterial.diffuse = new pc.Color(0.1, 0.1, 0.1);
    glassMaterial.gloss = 0.9;
    glassMaterial.update();

    const glasses = this.engine.createEntity('Glasses', this.entity);
    glasses.addComponent('render', {
      type: 'torus',
      material: glassMaterial,
    });
    glasses.setLocalScale(0.08, 0.08, 0.02);
    glasses.setPosition(0, 0.92, 0.18);

    // Wand
    const wandMaterial = new pc.StandardMaterial();
    wandMaterial.diffuse = new pc.Color(0.4, 0.25, 0.15);
    wandMaterial.specular = new pc.Color(0.5, 0.4, 0.3);
    wandMaterial.gloss = 0.7;
    wandMaterial.update();

    const wand = this.engine.createEntity('Wand', this.entity);
    wand.addComponent('render', {
      type: 'cylinder',
      material: wandMaterial,
    });
    wand.setLocalScale(0.03, 0.25, 0.03);
    wand.setPosition(0.35, 0.4, 0);
    wand.setEulerAngles(0, 0, -45);

    // Scar (lightning bolt shape using box)
    const scarMaterial = new pc.StandardMaterial();
    scarMaterial.diffuse = new pc.Color(0.8, 0.2, 0.2);
    scarMaterial.emissive = new pc.Color(0.3, 0.1, 0.1);
    scarMaterial.gloss = 0.5;
    scarMaterial.update();

    const scar = this.engine.createEntity('Scar', this.entity);
    scar.addComponent('render', {
      type: 'box',
      material: scarMaterial,
    });
    scar.setLocalScale(0.02, 0.08, 0.01);
    scar.setPosition(0.08, 1.0, 0.19);
    scar.setEulerAngles(0, 0, 30);
  }

  /**
   * Update character (called every frame)
   */
  update(dt: number): void {
    this.handleInput(dt);
    this.applyPhysics(dt);
  }

  /**
   * Handle input
   */
  protected handleInput(dt: number): void {
    const app = this.engine.app;
    const keyboard = app.keyboard;
    
    if (!keyboard) return;

    const moveDir = new pc.Vec3();

    // WASD or Arrow keys
    if (keyboard.isPressed(pc.KEY_W) || keyboard.isPressed(pc.KEY_UP)) {
      moveDir.z -= 1;
    }
    if (keyboard.isPressed(pc.KEY_S) || keyboard.isPressed(pc.KEY_DOWN)) {
      moveDir.z += 1;
    }
    if (keyboard.isPressed(pc.KEY_A) || keyboard.isPressed(pc.KEY_LEFT)) {
      moveDir.x -= 1;
    }
    if (keyboard.isPressed(pc.KEY_D) || keyboard.isPressed(pc.KEY_RIGHT)) {
      moveDir.x += 1;
    }

    // Normalize and apply speed
    if (moveDir.length() > 0) {
      moveDir.normalize();
      moveDir.mulScalar(this.config.speed * dt);
      
      const pos = this.entity.getPosition();
      this.entity.setPosition(
        pos.x + moveDir.x,
        pos.y,
        pos.z + moveDir.z
      );

      // Rotate to face movement direction
      if (moveDir.x !== 0 || moveDir.z !== 0) {
        const angle = Math.atan2(moveDir.x, moveDir.z) * pc.math.RAD_TO_DEG;
        this.entity.setEulerAngles(0, angle, 0);
      }
    }

    // Jump
    if (keyboard.wasPressed(pc.KEY_SPACE) && this.isGrounded && this.canJump) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
    }
  }

  /**
   * Apply physics
   */
  protected applyPhysics(dt: number): void {
    // Simple gravity
    if (!this.isGrounded) {
      this.velocity.y -= 20 * dt; // Gravity
      
      const pos = this.entity.getPosition();
      const newY = pos.y + this.velocity.y * dt;
      
      // Ground check
      if (newY <= 0.5) {
        this.entity.setPosition(pos.x, 0.5, pos.z);
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.entity.setPosition(pos.x, newY, pos.z);
      }
    }
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): void {
    this.entity.setPosition(x, y, z);
  }

  /**
   * Get position
   */
  getPosition(): pc.Vec3 {
    return this.entity.getPosition();
  }

  /**
   * Destroy character
   */
  destroy(): void {
    this.entity.destroy();
  }
}

/**
 * Nano Ladybug - Speed-focused character
 */
export class NanoLadybug extends Character {
  private dashCooldown: number = 0;

  constructor(parent?: pc.Entity) {
    super('ladybug', parent);
  }

  update(dt: number): void {
    super.update(dt);
    
    // Dash ability
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    const keyboard = this.engine.app.keyboard;
    if (keyboard?.wasPressed(pc.KEY_SHIFT) && this.dashCooldown <= 0) {
      this.dash();
    }
  }

  private dash(): void {
    const forward = this.entity.forward.clone();
    forward.mulScalar(5); // Dash distance
    
    const pos = this.entity.getPosition();
    this.entity.setPosition(
      pos.x + forward.x,
      pos.y,
      pos.z + forward.z
    );
    
    this.dashCooldown = 1; // 1 second cooldown
    console.log('[Ladybug] Dash!');
  }
}

/**
 * Nano Harry - Magic-focused character
 */
export class NanoHarry extends Character {
  private isCastingSpell: boolean = false;
  private spellParticles: pc.Entity | null = null;

  constructor(parent?: pc.Entity) {
    super('harry', parent);
  }

  update(dt: number): void {
    super.update(dt);
    
    // Spell casting
    const keyboard = this.engine.app.keyboard;
    if (keyboard?.wasPressed(pc.KEY_SHIFT)) {
      this.castSpell();
    }
  }

  private castSpell(): void {
    if (this.isCastingSpell) return;
    
    this.isCastingSpell = true;
    console.log('[Harry] Casting spell!');
    
    // Create spell effect (simple glowing sphere)
    this.spellParticles = this.engine.createEntity('SpellEffect', this.entity);
    
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.8, 1);
    material.emissive = new pc.Color(0.3, 0.5, 0.8);
    material.opacity = 0.7;
    material.blendType = pc.BLEND_ADDITIVE;
    material.update();
    
    this.spellParticles.addComponent('render', {
      type: 'sphere',
      material: material,
    });
    this.spellParticles.setLocalScale(0.2, 0.2, 0.2);
    this.spellParticles.setPosition(0.35, 0.55, 0);
    
    // Remove after duration
    setTimeout(() => {
      this.spellParticles?.destroy();
      this.spellParticles = null;
      this.isCastingSpell = false;
    }, 500);
  }
}

export default Character;
