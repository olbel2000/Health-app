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
    app.scene.skyboxIntensity = 1.0;
    
    // Set ambient light for that toy-like aesthetic
    app.scene.ambientLight = new pc.Color(0.4, 0.45, 0.5);
    
    // Note: Fog is configured per-camera in PlayCanvas 2.x
  }

  /**
   * Setup PBR lighting for high-gloss vinyl look
   */
  private setupLighting(): void {
    // Main directional light (sun)
    this.directionalLight = this.engine.createEntity('DirectionalLight', this.root);
    this.directionalLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.95, 0.9),
      intensity: 1.2,
      castShadows: true,
      shadowBias: 0.05,
      normalOffsetBias: 0.05,
      shadowResolution: 2048,
      shadowDistance: 50,
    });
    this.directionalLight.setEulerAngles(45, 135, 0);

    // Fill light for softer shadows
    const fillLight = this.engine.createEntity('FillLight', this.root);
    fillLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.6, 0.7, 0.9),
      intensity: 0.4,
      castShadows: false,
    });
    fillLight.setEulerAngles(30, -45, 0);

    // Rim light for that glossy pop
    const rimLight = this.engine.createEntity('RimLight', this.root);
    rimLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.9, 0.8),
      intensity: 0.3,
      castShadows: false,
    });
    rimLight.setEulerAngles(-20, 180, 0);
  }

  /**
   * Setup camera
   */
  private setupCamera(): void {
    this.camera = this.engine.createEntity('Camera', this.root);
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.5, 0.7, 0.9),
      fov: 45,
      nearClip: 0.1,
      farClip: 100,
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
   * Create island ground material
   */
  private createIslandMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.4, 0.7, 0.3);
    material.specular = new pc.Color(0.1, 0.1, 0.1);
    material.gloss = 0.3;
    material.update();
    return material;
  }

  /**
   * Create rock material
   */
  private createRockMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.4, 0.35);
    material.specular = new pc.Color(0.1, 0.1, 0.1);
    material.gloss = 0.2;
    material.update();
    return material;
  }

  /**
   * Create grass material
   */
  private createGrassMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.3, 0.8, 0.3);
    material.specular = new pc.Color(0.2, 0.3, 0.2);
    material.gloss = 0.4;
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
   * Create stylized water material
   */
  private createWaterMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.2, 0.5, 0.8);
    material.specular = new pc.Color(0.8, 0.9, 1.0);
    material.gloss = 0.9;
    material.opacity = 0.8;
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
    // Create placeholder trees
    const treePositions = [
      { x: 3, z: 3 },
      { x: -4, z: 2 },
      { x: 2, z: -4 },
      { x: -3, z: -3 },
    ];

    treePositions.forEach((pos, i) => {
      const tree = this.createTree(`Tree_${i}`);
      tree.setPosition(pos.x, 0.5, pos.z);
      tree.setLocalScale(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
    });

    // Create collectible placeholders (will be replaced with 3D words)
    this.createPlaceholderCollectibles();
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
   * Create trunk material
   */
  private createTrunkMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.35, 0.2);
    material.gloss = 0.3;
    material.update();
    return material;
  }

  /**
   * Create foliage material
   */
  private createFoliageMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.2, 0.7, 0.3);
    material.specular = new pc.Color(0.3, 0.4, 0.3);
    material.gloss = 0.5;
    material.update();
    return material;
  }

  /**
   * Create placeholder collectibles
   */
  private createPlaceholderCollectibles(): void {
    const positions = [
      { x: 2, z: 0 },
      { x: -2, z: 1 },
      { x: 0, z: -2 },
    ];

    const colors = [
      new pc.Color(1, 0.4, 0.4),  // Red
      new pc.Color(0.4, 1, 0.4),  // Green
      new pc.Color(0.4, 0.4, 1),  // Blue
    ];

    positions.forEach((pos, i) => {
      const collectible = this.engine.createEntity(`Collectible_${i}`, this.root);
      
      // Create glossy material for that vinyl toy look
      const material = new pc.StandardMaterial();
      material.diffuse = colors[i];
      material.specular = new pc.Color(1, 1, 1);
      material.gloss = 0.9;
      material.metalness = 0.1;
      material.update();

      collectible.addComponent('render', {
        type: 'sphere',
        material: material,
      });
      collectible.setPosition(pos.x, 1.5, pos.z);
      collectible.setLocalScale(0.5, 0.5, 0.5);

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
