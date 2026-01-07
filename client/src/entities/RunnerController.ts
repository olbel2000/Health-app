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
    
    // Main body - red with black spots
    const bodyMat = new pc.StandardMaterial();
    bodyMat.diffuse = new pc.Color(0.9, 0.15, 0.15);
    bodyMat.specular = new pc.Color(1, 0.8, 0.8);
    bodyMat.gloss = 0.95;
    bodyMat.metalness = 0.3;
    bodyMat.useMetalness = true;
    bodyMat.update();
    
    const body = new pc.Entity('body');
    body.addComponent('render', { type: 'sphere', material: bodyMat });
    body.setLocalScale(0.8, 0.5, 1);
    character.addChild(body);
    
    // Head
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    headMat.specular = new pc.Color(0.5, 0.5, 0.5);
    headMat.gloss = 0.9;
    headMat.update();
    
    const head = new pc.Entity('head');
    head.addComponent('render', { type: 'sphere', material: headMat });
    head.setLocalScale(0.35, 0.3, 0.35);
    head.setPosition(0, 0.1, 0.5);
    character.addChild(head);
    
    // Eyes
    const eyeMat = new pc.StandardMaterial();
    eyeMat.diffuse = new pc.Color(1, 1, 1);
    eyeMat.emissive = new pc.Color(0.1, 0.1, 0.1);
    eyeMat.gloss = 0.95;
    eyeMat.update();
    
    const pupilMat = new pc.StandardMaterial();
    pupilMat.diffuse = new pc.Color(0.05, 0.05, 0.05);
    pupilMat.update();
    
    [-0.1, 0.1].forEach((x, i) => {
      const eye = new pc.Entity(`eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.12, 0.12, 0.08);
      eye.setPosition(x, 0.18, 0.62);
      character.addChild(eye);
      
      const pupil = new pc.Entity(`pupil_${i}`);
      pupil.addComponent('render', { type: 'sphere', material: pupilMat });
      pupil.setLocalScale(0.05, 0.06, 0.04);
      pupil.setPosition(x, 0.18, 0.66);
      character.addChild(pupil);
    });
    
    // Antennae
    const antennaMat = new pc.StandardMaterial();
    antennaMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    antennaMat.update();
    
    [-0.08, 0.08].forEach((x, i) => {
      const antenna = new pc.Entity(`antenna_${i}`);
      antenna.addComponent('render', { type: 'cylinder', material: antennaMat });
      antenna.setLocalScale(0.02, 0.15, 0.02);
      antenna.setPosition(x, 0.35, 0.5);
      antenna.setEulerAngles(0, 0, x < 0 ? 20 : -20);
      character.addChild(antenna);
      
      const tip = new pc.Entity(`antenna_tip_${i}`);
      tip.addComponent('render', { type: 'sphere', material: antennaMat });
      tip.setLocalScale(0.05, 0.05, 0.05);
      tip.setPosition(x * 1.5, 0.45, 0.5);
      character.addChild(tip);
    });
    
    // Black spots on body
    const spotMat = new pc.StandardMaterial();
    spotMat.diffuse = new pc.Color(0.05, 0.05, 0.05);
    spotMat.gloss = 0.9;
    spotMat.update();
    
    const spots = [
      { x: -0.2, y: 0.15, z: 0.1, s: 0.12 },
      { x: 0.22, y: 0.12, z: -0.05, s: 0.1 },
      { x: 0, y: 0.2, z: -0.2, s: 0.14 },
      { x: -0.15, y: 0.1, z: -0.25, s: 0.1 },
      { x: 0.18, y: 0.15, z: -0.3, s: 0.11 },
    ];
    
    spots.forEach((spot, i) => {
      const s = new pc.Entity(`spot_${i}`);
      s.addComponent('render', { type: 'sphere', material: spotMat });
      s.setLocalScale(spot.s, spot.s * 0.3, spot.s);
      s.setPosition(spot.x, spot.y, spot.z);
      character.addChild(s);
    });
    
    // Wing line (center divide)
    const wingLine = new pc.Entity('wing_line');
    wingLine.addComponent('render', { type: 'box', material: antennaMat });
    wingLine.setLocalScale(0.03, 0.01, 0.8);
    wingLine.setPosition(0, 0.25, -0.1);
    character.addChild(wingLine);
    
    // Legs
    const legMat = new pc.StandardMaterial();
    legMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
    legMat.update();
    
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const zOffset = (i % 3 - 1) * 0.25;
      
      const leg = new pc.Entity(`leg_${i}`);
      leg.addComponent('render', { type: 'capsule', material: legMat });
      leg.setLocalScale(0.04, 0.12, 0.04);
      leg.setPosition(side * 0.35, -0.15, zOffset);
      leg.setEulerAngles(0, 0, side * 30);
      character.addChild(leg);
    }
    
    return character;
  }

  /**
   * Reset runner to starting position
   */
  reset(): void {
    this.currentLane = Math.floor(this.config.lanes / 2);
    this.targetX = 0;
    this.currentX = 0;
    this.currentY = 0.5;
    this.isJumping = false;
    this.isSliding = false;
    this.jumpVelocity = 0;
    this.bobTime = 0;
    
    this.entity.setPosition(0, 0.5, 0);
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
      
      if (this.currentY <= 0.5) {
        this.currentY = 0.5;
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
    const y = this.isSliding ? 0.25 : this.currentY + bob;
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
