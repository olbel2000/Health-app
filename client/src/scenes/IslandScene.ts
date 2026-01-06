/**
 * Island Scene
 * The main floating island world for Lingo Island
 * Features PBR lighting and "Nano Banana" aesthetic
 */

import * as pc from 'playcanvas';
import { Scene } from '../core/SceneManager';
import type { CharacterType, CollectibleConfig } from '../types';

export class IslandScene extends Scene {
  private camera!: pc.Entity;
  private directionalLight!: pc.Entity;
  private island!: pc.Entity;
  private water!: pc.Entity;
  private character: pc.Entity | null = null;
  private collectibles: pc.Entity[] = [];
  
  // Camera orbit
  private cameraAngle: number = 0;
  private cameraDistance: number = 15;
  private cameraHeight: number = 8;
  private cameraTarget: pc.Vec3 = new pc.Vec3(0, 2, 0);

  constructor() {
    super('island');
  }

  async onEnter(): Promise<void> {
    // Setup environment
    this.setupSkybox();
    this.setupLighting();
    this.setupCamera();
    this.createIsland();
    this.createWater();
    this.createDecorations();

    // Setup character selection
    this.setupCharacterSelection();

    console.log('[IslandScene] Scene ready');
  }

  onUpdate(dt: number): void {
    // Gentle camera orbit for menu state
    if (this.engine.state === 'character-select' || this.engine.state === 'menu') {
      this.cameraAngle += dt * 0.1;
      this.updateCameraOrbit();
    }

    // Animate water
    this.animateWater(dt);

    // Rotate collectibles
    this.animateCollectibles(dt);
  }

  async onExit(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Setup gradient skybox
   */
  private setupSkybox(): void {
    const app = this.engine.app;
    
    // Create a colorful sky gradient
    app.scene.skyboxMip = 0;
    app.scene.skyboxIntensity = 1.2;
    
    // Set ambient light for that magical toy-like aesthetic
    app.scene.ambientLight = new pc.Color(0.35, 0.4, 0.5);
    
    // Exposure for HDR look
    app.scene.exposure = 1.3;
  }

  /**
   * Setup PBR lighting for high-gloss vinyl look
   */
  private setupLighting(): void {
    // Main directional light (sun) - warm golden light
    this.directionalLight = this.engine.createEntity('DirectionalLight', this.root);
    this.directionalLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.92, 0.8),
      intensity: 1.5,
      castShadows: true,
      shadowBias: 0.05,
      normalOffsetBias: 0.05,
      shadowResolution: 2048,
      shadowDistance: 50,
    });
    this.directionalLight.setEulerAngles(50, 130, 0);

    // Fill light - cool blue for contrast
    const fillLight = this.engine.createEntity('FillLight', this.root);
    fillLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.5, 0.7, 1.0),
      intensity: 0.5,
      castShadows: false,
    });
    fillLight.setEulerAngles(30, -60, 0);

    // Rim light - magenta tint for magical feel
    const rimLight = this.engine.createEntity('RimLight', this.root);
    rimLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1.0, 0.7, 0.9),
      intensity: 0.4,
      castShadows: false,
    });
    rimLight.setEulerAngles(-15, 200, 0);

    // Add a subtle point light at the center for glow effect
    const centerGlow = this.engine.createEntity('CenterGlow', this.root);
    centerGlow.addComponent('light', {
      type: 'point',
      color: new pc.Color(0.4, 0.9, 0.8),
      intensity: 0.8,
      range: 15,
      castShadows: false,
    });
    centerGlow.setPosition(0, 3, 0);
  }

  /**
   * Setup camera
   */
  private setupCamera(): void {
    this.camera = this.engine.createEntity('Camera', this.root);
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.08, 0.1, 0.18),
      fov: 50,
      nearClip: 0.1,
      farClip: 150,
    });
    
    this.updateCameraOrbit();
  }

  /**
   * Update camera orbit position
   */
  private updateCameraOrbit(): void {
    const x = Math.sin(this.cameraAngle) * this.cameraDistance;
    const z = Math.cos(this.cameraAngle) * this.cameraDistance;
    
    this.camera.setPosition(
      this.cameraTarget.x + x,
      this.cameraTarget.y + this.cameraHeight,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Create the floating island
   */
  private createIsland(): void {
    this.island = this.engine.createEntity('Island', this.root);

    // Main island platform (top)
    const islandTop = this.engine.createEntity('IslandTop', this.island);
    islandTop.addComponent('render', {
      type: 'cylinder',
      material: this.createIslandMaterial(),
    });
    islandTop.setLocalScale(12, 1, 12);
    islandTop.setPosition(0, 0, 0);

    // Island bottom (cone shape for floating effect)
    const islandBottom = this.engine.createEntity('IslandBottom', this.island);
    islandBottom.addComponent('render', {
      type: 'cone',
      material: this.createRockMaterial(),
    });
    islandBottom.setLocalScale(10, 6, 10);
    islandBottom.setPosition(0, -3.5, 0);
    islandBottom.setEulerAngles(180, 0, 0);

    // Grass ring on top
    const grassRing = this.engine.createEntity('GrassRing', this.island);
    grassRing.addComponent('render', {
      type: 'torus',
      material: this.createGrassMaterial(),
    });
    grassRing.setLocalScale(5, 0.3, 5);
    grassRing.setPosition(0, 0.5, 0);
  }

  /**
   * Create island ground material - Lush green with subtle gloss
   */
  private createIslandMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.25, 0.65, 0.3);
    material.specular = new pc.Color(0.3, 0.4, 0.3);
    material.gloss = 0.5;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create rock material - Stylized purple/blue rocks
   */
  private createRockMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.4, 0.35, 0.5);
    material.specular = new pc.Color(0.5, 0.4, 0.6);
    material.gloss = 0.6;
    material.metalness = 0.1;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create grass material - Vibrant cartoon grass
   */
  private createGrassMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.2, 0.75, 0.35);
    material.specular = new pc.Color(0.4, 0.6, 0.4);
    material.gloss = 0.65;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create water plane around island
   */
  private createWater(): void {
    this.water = this.engine.createEntity('Water', this.root);
    this.water.addComponent('render', {
      type: 'plane',
      material: this.createWaterMaterial(),
    });
    this.water.setLocalScale(100, 1, 100);
    this.water.setPosition(0, -2, 0);
  }

  /**
   * Create stylized water material - Magical glowing water
   */
  private createWaterMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.15, 0.4, 0.7);
    material.specular = new pc.Color(1.0, 1.0, 1.0);
    material.emissive = new pc.Color(0.05, 0.15, 0.3);
    material.gloss = 0.95;
    material.metalness = 0.2;
    material.useMetalness = true;
    material.opacity = 0.85;
    material.blendType = pc.BLEND_NORMAL;
    material.update();
    return material;
  }

  /**
   * Animate water
   */
  private animateWater(_dt: number): void {
    if (this.water) {
      const y = -2 + Math.sin(Date.now() * 0.001) * 0.1;
      this.water.setPosition(0, y, 0);
    }
  }

  /**
   * Create decorative elements
   */
  private createDecorations(): void {
    // Create placeholder trees - more variety
    const treePositions = [
      { x: 3.5, z: 3, scale: 1.0 },
      { x: -4, z: 2.5, scale: 1.2 },
      { x: 2.5, z: -4, scale: 0.9 },
      { x: -3.5, z: -3.5, scale: 1.1 },
      { x: 4.5, z: -1, scale: 0.85 },
      { x: -4.5, z: -1.5, scale: 0.95 },
    ];

    treePositions.forEach((pos, i) => {
      const tree = this.createTree(`Tree_${i}`);
      tree.setPosition(pos.x, 0.5, pos.z);
      tree.setLocalScale(pos.scale, pos.scale * (0.9 + Math.random() * 0.3), pos.scale);
    });

    // Add decorative crystals
    this.createCrystals();

    // Add floating rings around island
    this.createFloatingRings();

    // Create collectible placeholders (will be replaced with 3D words)
    this.createPlaceholderCollectibles();
  }

  /**
   * Create decorative crystals
   */
  private createCrystals(): void {
    const crystalPositions = [
      { x: -5, z: 0, color: new pc.Color(0.4, 0.8, 1) },
      { x: 5, z: -2, color: new pc.Color(1, 0.5, 0.8) },
      { x: 0, z: 5, color: new pc.Color(0.6, 1, 0.7) },
    ];

    crystalPositions.forEach((pos, i) => {
      const crystal = this.engine.createEntity(`Crystal_${i}`, this.root);
      
      const material = new pc.StandardMaterial();
      material.diffuse = pos.color;
      material.emissive = new pc.Color(pos.color.r * 0.3, pos.color.g * 0.3, pos.color.b * 0.3);
      material.specular = new pc.Color(1, 1, 1);
      material.gloss = 0.98;
      material.metalness = 0.5;
      material.useMetalness = true;
      material.opacity = 0.85;
      material.blendType = pc.BLEND_NORMAL;
      material.update();

      crystal.addComponent('render', {
        type: 'cone',
        material: material,
      });
      crystal.setPosition(pos.x, 0.3, pos.z);
      crystal.setLocalScale(0.4, 1.2, 0.4);
    });
  }

  /**
   * Create floating magical rings
   */
  private createFloatingRings(): void {
    for (let i = 0; i < 3; i++) {
      const ring = this.engine.createEntity(`Ring_${i}`, this.root);
      
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(0.3, 0.6, 1);
      material.emissive = new pc.Color(0.1, 0.2, 0.4);
      material.opacity = 0.3;
      material.blendType = pc.BLEND_ADDITIVE;
      material.update();

      ring.addComponent('render', {
        type: 'torus',
        material: material,
      });
      ring.setPosition(0, -1 - i * 1.5, 0);
      ring.setLocalScale(8 + i * 2, 8 + i * 2, 0.1);
      ring.setEulerAngles(90, 0, 0);
    }
  }

  /**
   * Create a simple tree
   */
  private createTree(name: string): pc.Entity {
    const tree = this.engine.createEntity(name, this.root);

    // Trunk
    const trunk = this.engine.createEntity('Trunk', tree);
    trunk.addComponent('render', {
      type: 'cylinder',
      material: this.createTrunkMaterial(),
    });
    trunk.setLocalScale(0.3, 2, 0.3);
    trunk.setPosition(0, 1, 0);

    // Foliage (sphere)
    const foliage = this.engine.createEntity('Foliage', tree);
    foliage.addComponent('render', {
      type: 'sphere',
      material: this.createFoliageMaterial(),
    });
    foliage.setLocalScale(1.5, 1.5, 1.5);
    foliage.setPosition(0, 2.5, 0);

    return tree;
  }

  /**
   * Create trunk material - Stylized brown with warm tones
   */
  private createTrunkMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.55, 0.35, 0.25);
    material.specular = new pc.Color(0.4, 0.3, 0.25);
    material.gloss = 0.45;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create foliage material - Bouncy cartoon leaves
   */
  private createFoliageMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.15, 0.7, 0.35);
    material.specular = new pc.Color(0.5, 0.7, 0.5);
    material.gloss = 0.7;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create placeholder collectibles - Glowing magical orbs
   */
  private createPlaceholderCollectibles(): void {
    const positions = [
      { x: 2.5, z: 0.5 },
      { x: -2.5, z: 1.5 },
      { x: 0.5, z: -2.5 },
      { x: -1, z: -1.5 },
      { x: 1.5, z: 2 },
    ];

    const colors = [
      { diffuse: new pc.Color(1, 0.3, 0.4), emissive: new pc.Color(0.3, 0.05, 0.08) },   // Ruby
      { diffuse: new pc.Color(0.3, 1, 0.5), emissive: new pc.Color(0.05, 0.25, 0.1) },   // Emerald
      { diffuse: new pc.Color(0.3, 0.5, 1), emissive: new pc.Color(0.05, 0.1, 0.3) },    // Sapphire
      { diffuse: new pc.Color(1, 0.85, 0.2), emissive: new pc.Color(0.3, 0.2, 0.02) },   // Gold
      { diffuse: new pc.Color(0.9, 0.4, 1), emissive: new pc.Color(0.2, 0.08, 0.25) },   // Amethyst
    ];

    positions.forEach((pos, i) => {
      const collectible = this.engine.createEntity(`Collectible_${i}`, this.root);
      
      // Create glossy glowing material for magical gems
      const material = new pc.StandardMaterial();
      material.diffuse = colors[i % colors.length].diffuse;
      material.emissive = colors[i % colors.length].emissive;
      material.specular = new pc.Color(1, 1, 1);
      material.gloss = 0.95;
      material.metalness = 0.3;
      material.useMetalness = true;
      material.update();

      // Main gem shape
      collectible.addComponent('render', {
        type: 'sphere',
        material: material,
      });
      collectible.setPosition(pos.x, 1.8, pos.z);
      collectible.setLocalScale(0.45, 0.45, 0.45);

      // Add inner glow sphere
      const innerGlow = this.engine.createEntity('InnerGlow', collectible);
      const glowMat = new pc.StandardMaterial();
      glowMat.diffuse = colors[i % colors.length].diffuse;
      glowMat.emissive = colors[i % colors.length].diffuse;
      glowMat.emissiveIntensity = 0.5;
      glowMat.opacity = 0.4;
      glowMat.blendType = pc.BLEND_ADDITIVE;
      glowMat.update();
      
      innerGlow.addComponent('render', {
        type: 'sphere',
        material: glowMat,
      });
      innerGlow.setLocalScale(1.4, 1.4, 1.4);

      this.collectibles.push(collectible);
    });
  }

  /**
   * Animate collectibles
   */
  private animateCollectibles(dt: number): void {
    const time = Date.now() * 0.001;
    
    this.collectibles.forEach((collectible, i) => {
      // Rotate
      collectible.rotate(0, 60 * dt, 0);
      
      // Bob up and down
      const pos = collectible.getPosition();
      const baseY = 1.5;
      const newY = baseY + Math.sin(time * 2 + i) * 0.2;
      collectible.setPosition(pos.x, newY, pos.z);
    });
  }

  /**
   * Setup character selection handlers
   */
  private setupCharacterSelection(): void {
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
      card.addEventListener('click', () => {
        const character = card.getAttribute('data-character') as CharacterType;
        this.onCharacterSelected(character);
      });
    });
  }

  /**
   * Handle character selection
   */
  private onCharacterSelected(character: CharacterType): void {
    console.log(`[IslandScene] Character selected: ${character}`);
    
    this.engine.selectCharacter(character);
    this.engine.state = 'playing';
    
    // Create character placeholder
    this.createCharacterPlaceholder(character);
    
    // Show first word
    this.engine.showWord('apple', 'A delicious red fruit');
  }

  /**
   * Create character placeholder
   */
  private createCharacterPlaceholder(type: CharacterType): void {
    if (this.character) {
      this.character.destroy();
    }

    this.character = this.engine.createEntity(`Character_${type}`, this.root);
    
    // Create glossy character material
    const material = new pc.StandardMaterial();
    if (type === 'ladybug') {
      material.diffuse = new pc.Color(1, 0.3, 0.3);
    } else {
      material.diffuse = new pc.Color(0.4, 0.3, 0.7);
    }
    material.specular = new pc.Color(1, 1, 1);
    material.gloss = 0.95;
    material.metalness = 0.2;
    material.update();

    // Body
    const body = this.engine.createEntity('Body', this.character);
    body.addComponent('render', {
      type: 'capsule',
      material: material,
    });
    body.setLocalScale(0.6, 0.8, 0.6);
    body.setPosition(0, 0.5, 0);

    // Head
    const head = this.engine.createEntity('Head', this.character);
    head.addComponent('render', {
      type: 'sphere',
      material: material,
    });
    head.setLocalScale(0.5, 0.5, 0.5);
    head.setPosition(0, 1.2, 0);

    this.character.setPosition(0, 0.5, 0);

    // Move camera closer
    this.cameraDistance = 10;
    this.cameraHeight = 5;
    this.cameraTarget.set(0, 1, 0);
  }

  /**
   * Add a word collectible to the scene
   */
  addWordCollectible(config: CollectibleConfig, entity: pc.Entity): void {
    entity.setPosition(config.position.x, config.position.y, config.position.z);
    if (config.scale) {
      entity.setLocalScale(config.scale, config.scale, config.scale);
    }
    this.root.addChild(entity);
    this.collectibles.push(entity);
  }

  /**
   * Get camera entity
   */
  getCamera(): pc.Entity {
    return this.camera;
  }

  /**
   * Get character entity
   */
  getCharacter(): pc.Entity | null {
    return this.character;
  }
}

export default IslandScene;
