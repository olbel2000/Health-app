/**
 * Runner Controller
 * Handles character movement in Word Ninja mode
 * Supports lane-based movement with smooth transitions
 */

import * as pc from 'playcanvas';
import type { WordNinjaConfig } from '../scenes/WordNinjaScene';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export class RunnerController {
  private root: pc.Entity;
  private config: WordNinjaConfig;
  private entity: pc.Entity;
  
  private currentLane = 1; // 0 = left, 1 = center, 2 = right
  private targetX = 0;
  private currentX = 0;
  private laneChangeSpeed = 12;
  
  private isJumping = false;
  private jumpVelocity = 0;
  private jumpHeight = 2;
  private gravity = 15;
  private currentY = 0.5;
  
  private isSliding = false;
  private slideTimer = 0;
  private slideDuration = 0.5;
  
  private bobTime = 0;
  private bobSpeed = 15;
  private bobAmount = 0.08;

  constructor(root: pc.Entity, config: WordNinjaConfig) {
    this.root = root;
    this.config = config;
    
    this.entity = this.createCharacter();
    this.reset();
    
    this.root.addChild(this.entity);
  }

  /**
   * Create the Ladybug runner character
   */
  private createCharacter(): pc.Entity {
    const character = new pc.Entity('runner');
    
    // Make character bigger and more visible
    const scale = 1.5;
    
    // Main body - bright red with glossy finish
    const bodyMat = new pc.StandardMaterial();
    bodyMat.diffuse = new pc.Color(1, 0.15, 0.15);
    bodyMat.emissive = new pc.Color(0.2, 0.02, 0.02);
    bodyMat.specular = new pc.Color(1, 0.9, 0.9);
    bodyMat.gloss = 0.95;
    bodyMat.metalness = 0.4;
    bodyMat.useMetalness = true;
    bodyMat.update();
    
    const body = new pc.Entity('body');
    body.addComponent('render', { type: 'sphere', material: bodyMat });
    body.setLocalScale(0.8 * scale, 0.5 * scale, 1 * scale);
    character.addChild(body);
    
    // Head - glossy black
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    headMat.specular = new pc.Color(0.6, 0.6, 0.6);
    headMat.gloss = 0.95;
    headMat.update();
    
    const head = new pc.Entity('head');
    head.addComponent('render', { type: 'sphere', material: headMat });
    head.setLocalScale(0.35 * scale, 0.3 * scale, 0.35 * scale);
    head.setPosition(0, 0.1 * scale, 0.6 * scale);
    character.addChild(head);
    
    // Big cute eyes - white with pupils
    const eyeMat = new pc.StandardMaterial();
    eyeMat.diffuse = new pc.Color(1, 1, 1);
    eyeMat.emissive = new pc.Color(0.2, 0.2, 0.2);
    eyeMat.gloss = 0.98;
    eyeMat.update();
    
    const pupilMat = new pc.StandardMaterial();
    pupilMat.diffuse = new pc.Color(0.02, 0.02, 0.02);
    pupilMat.gloss = 0.9;
    pupilMat.update();
    
    [-0.12, 0.12].forEach((x, i) => {
      const eye = new pc.Entity(`eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.15 * scale, 0.15 * scale, 0.1 * scale);
      eye.setPosition(x * scale, 0.2 * scale, 0.75 * scale);
      character.addChild(eye);
      
      const pupil = new pc.Entity(`pupil_${i}`);
      pupil.addComponent('render', { type: 'sphere', material: pupilMat });
      pupil.setLocalScale(0.07 * scale, 0.08 * scale, 0.05 * scale);
      pupil.setPosition(x * scale, 0.2 * scale, 0.8 * scale);
      character.addChild(pupil);
      
      // Eye highlight
      const highlightMat = new pc.StandardMaterial();
      highlightMat.diffuse = new pc.Color(1, 1, 1);
      highlightMat.emissive = new pc.Color(0.5, 0.5, 0.5);
      highlightMat.opacity = 0.8;
      highlightMat.update();
      
      const highlight = new pc.Entity(`eye_highlight_${i}`);
      highlight.addComponent('render', { type: 'sphere', material: highlightMat });
      highlight.setLocalScale(0.04 * scale, 0.04 * scale, 0.02 * scale);
      highlight.setPosition((x - 0.03) * scale, 0.24 * scale, 0.81 * scale);
      character.addChild(highlight);
    });
    
    // Antennae with bobbles
    const antennaMat = new pc.StandardMaterial();
    antennaMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    antennaMat.gloss = 0.8;
    antennaMat.update();
    
    [-0.1, 0.1].forEach((x, i) => {
      const antenna = new pc.Entity(`antenna_${i}`);
      antenna.addComponent('render', { type: 'cylinder', material: antennaMat });
      antenna.setLocalScale(0.03 * scale, 0.2 * scale, 0.03 * scale);
      antenna.setPosition(x * scale, 0.4 * scale, 0.55 * scale);
      antenna.setEulerAngles(15, 0, x < 0 ? 25 : -25);
      character.addChild(antenna);
      
      const tip = new pc.Entity(`antenna_tip_${i}`);
      tip.addComponent('render', { type: 'sphere', material: antennaMat });
      tip.setLocalScale(0.08 * scale, 0.08 * scale, 0.08 * scale);
      tip.setPosition(x * 1.8 * scale, 0.55 * scale, 0.5 * scale);
      character.addChild(tip);
    });
    
    // Black spots on body - bigger and more visible
    const spotMat = new pc.StandardMaterial();
    spotMat.diffuse = new pc.Color(0.02, 0.02, 0.02);
    spotMat.gloss = 0.95;
    spotMat.update();
    
    const spots = [
      { x: -0.25, y: 0.18, z: 0.15, s: 0.18 },
      { x: 0.28, y: 0.15, z: -0.05, s: 0.15 },
      { x: 0, y: 0.25, z: -0.25, s: 0.2 },
      { x: -0.18, y: 0.12, z: -0.35, s: 0.14 },
      { x: 0.22, y: 0.18, z: -0.4, s: 0.16 },
      { x: 0, y: 0.12, z: 0.2, s: 0.12 },
    ];
    
    spots.forEach((spot, i) => {
      const s = new pc.Entity(`spot_${i}`);
      s.addComponent('render', { type: 'sphere', material: spotMat });
      s.setLocalScale(spot.s * scale, spot.s * 0.4 * scale, spot.s * scale);
      s.setPosition(spot.x * scale, spot.y * scale, spot.z * scale);
      character.addChild(s);
    });
    
    // Wing line (center divide)
    const wingLine = new pc.Entity('wing_line');
    wingLine.addComponent('render', { type: 'box', material: antennaMat });
    wingLine.setLocalScale(0.04 * scale, 0.02 * scale, 1 * scale);
    wingLine.setPosition(0, 0.26 * scale, -0.1 * scale);
    character.addChild(wingLine);
    
    // Legs - 6 cute little legs
    const legMat = new pc.StandardMaterial();
    legMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    legMat.gloss = 0.7;
    legMat.update();
    
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const zOffset = (i % 3 - 1) * 0.3;
      
      const leg = new pc.Entity(`leg_${i}`);
      leg.addComponent('render', { type: 'capsule', material: legMat });
      leg.setLocalScale(0.05 * scale, 0.15 * scale, 0.05 * scale);
      leg.setPosition(side * 0.4 * scale, -0.2 * scale, zOffset * scale);
      leg.setEulerAngles(0, 0, side * 35);
      character.addChild(leg);
    }
    
    // Add a small glow under the character
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = new pc.Color(1, 0.3, 0.3);
    glowMat.emissive = new pc.Color(0.3, 0.1, 0.1);
    glowMat.opacity = 0.3;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();
    
    const glow = new pc.Entity('glow');
    glow.addComponent('render', { type: 'sphere', material: glowMat });
    glow.setLocalScale(1.5 * scale, 0.3 * scale, 1.5 * scale);
    glow.setPosition(0, -0.3 * scale, 0);
    character.addChild(glow);
    
    return character;
  }

  /**
   * Reset runner to starting position
   */
  reset(): void {
    this.currentLane = Math.floor(this.config.lanes / 2);
    this.targetX = 0;
    this.currentX = 0;
    this.currentY = 1.0; // Higher starting position
    this.isJumping = false;
    this.isSliding = false;
    this.jumpVelocity = 0;
    this.bobTime = 0;
    
    this.entity.setPosition(0, 1.0, 0);
    this.entity.setLocalScale(1, 1, 1);
    this.entity.setEulerAngles(0, 0, 0);
  }

  /**
   * Change lane based on swipe direction
   */
  changeLane(direction: SwipeDirection): void {
    switch (direction) {
      case 'left':
        if (this.currentLane > 0) {
          this.currentLane--;
          this.targetX = this.getLaneX(this.currentLane);
        }
        break;
        
      case 'right':
        if (this.currentLane < this.config.lanes - 1) {
          this.currentLane++;
          this.targetX = this.getLaneX(this.currentLane);
        }
        break;
        
      case 'up':
        this.jump();
        break;
        
      case 'down':
        this.slide();
        break;
    }
  }

  /**
   * Get X position for a lane
   */
  private getLaneX(lane: number): number {
    const center = (this.config.lanes - 1) / 2;
    return (lane - center) * this.config.laneWidth;
  }

  /**
   * Start jump
   */
  private jump(): void {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.jumpVelocity = Math.sqrt(2 * this.gravity * this.jumpHeight);
    }
  }

  /**
   * Start slide
   */
  private slide(): void {
    if (!this.isJumping && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
    }
  }

  /**
   * Update runner position and animation
   */
  update(dt: number): void {
    // Smooth lane transition
    const dx = this.targetX - this.currentX;
    if (Math.abs(dx) > 0.01) {
      this.currentX += dx * this.laneChangeSpeed * dt;
    } else {
      this.currentX = this.targetX;
    }
    
    // Handle jumping
    if (this.isJumping) {
      this.jumpVelocity -= this.gravity * dt;
      this.currentY += this.jumpVelocity * dt;
      
      if (this.currentY <= 1.0) {
        this.currentY = 1.0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }
    
    // Handle sliding
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }
    
    // Running bob animation
    this.bobTime += dt * this.bobSpeed;
    const bob = this.isJumping ? 0 : Math.abs(Math.sin(this.bobTime)) * this.bobAmount;
    
    // Apply position
    const y = this.isSliding ? 0.5 : this.currentY + bob;
    this.entity.setPosition(this.currentX, y, 0);
    
    // Apply tilt when changing lanes
    const tilt = -dx * 15;
    const slideRotation = this.isSliding ? 25 : 0;
    this.entity.setEulerAngles(slideRotation, 0, tilt);
    
    // Scale for slide
    if (this.isSliding) {
      this.entity.setLocalScale(1.2, 0.5, 1);
    } else {
      this.entity.setLocalScale(1, 1, 1);
    }
  }

  /**
   * Get current position for collision detection
   */
  getPosition(): pc.Vec3 {
    return this.entity.getPosition();
  }

  /**
   * Get current lane
   */
  getCurrentLane(): number {
    return this.currentLane;
  }

  /**
   * Check if runner is jumping
   */
  getIsJumping(): boolean {
    return this.isJumping;
  }

  /**
   * Check if runner is sliding
   */
  getIsSliding(): boolean {
    return this.isSliding;
  }

  /**
   * Get collision bounds
   */
  getCollisionBounds(): { width: number; height: number } {
    return {
      width: 0.6,
      height: this.isSliding ? 0.3 : 0.8,
    };
  }
}

export default RunnerController;
