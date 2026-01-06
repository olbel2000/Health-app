/**
 * Island Scene
 * The main floating island world for Lingo Island
 * Features PBR lighting and "Nano Banana" aesthetic
 */

import * as pc from 'playcanvas';
import { Scene } from '../core/SceneManager';
import { TextureGenerator } from '../services/TextureGenerator';
import { TreeGenerator, TreeStyle } from '../entities/TreeGenerator';
import type { CharacterType, CollectibleConfig } from '../types';

export class IslandScene extends Scene {
  private camera!: pc.Entity;
  private directionalLight!: pc.Entity;
  private island!: pc.Entity;
  private water!: pc.Entity;
  private character: pc.Entity | null = null;
  private collectibles: pc.Entity[] = [];
  private textureGen!: TextureGenerator;
  private treeGen!: TreeGenerator;
  
  // Camera orbit
  private cameraAngle: number = 0;
  private cameraDistance: number = 15;
  private cameraHeight: number = 8;
  private cameraTarget: pc.Vec3 = new pc.Vec3(0, 2, 0);

  constructor() {
    super('island');
  }

  async onEnter(): Promise<void> {
    // Initialize generators
    this.textureGen = TextureGenerator.getInstance();
    this.treeGen = new TreeGenerator();

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
   * Create the floating island - detailed multi-layer design
   */
  private createIsland(): void {
    this.island = this.engine.createEntity('Island', this.root);

    const grassMat = this.createIslandMaterial();
    const rockMat = this.createRockMaterial();
    const dirtMat = this.createDirtMaterial();

    // Main island platform (top) - larger and more organic
    const islandTop = this.engine.createEntity('IslandTop', this.island);
    islandTop.addComponent('render', {
      type: 'cylinder',
      material: grassMat,
    });
    islandTop.setLocalScale(14, 0.8, 14);
    islandTop.setPosition(0, 0, 0);

    // Second grass layer for depth
    const islandTop2 = this.engine.createEntity('IslandTop2', this.island);
    islandTop2.addComponent('render', {
      type: 'cylinder',
      material: grassMat,
    });
    islandTop2.setLocalScale(12, 0.5, 12);
    islandTop2.setPosition(0.5, 0.3, -0.5);

    // Dirt layer
    const dirtLayer = this.engine.createEntity('DirtLayer', this.island);
    dirtLayer.addComponent('render', {
      type: 'cylinder',
      material: dirtMat,
    });
    dirtLayer.setLocalScale(13, 1.5, 13);
    dirtLayer.setPosition(0, -0.8, 0);

    // Main rock cone
    const islandBottom = this.engine.createEntity('IslandBottom', this.island);
    islandBottom.addComponent('render', {
      type: 'cone',
      material: rockMat,
    });
    islandBottom.setLocalScale(11, 7, 11);
    islandBottom.setPosition(0, -4, 0);
    islandBottom.setEulerAngles(180, 0, 0);

    // Secondary rock formations
    const rockPositions = [
      { x: 4, z: 3, scale: 0.6, rot: 15 },
      { x: -5, z: 2, scale: 0.5, rot: -20 },
      { x: 3, z: -4, scale: 0.55, rot: 10 },
      { x: -3, z: -3, scale: 0.45, rot: -15 },
      { x: 0, z: 5, scale: 0.5, rot: 5 },
    ];

    rockPositions.forEach((pos, i) => {
      const rock = this.engine.createEntity(`Rock_${i}`, this.island);
      rock.addComponent('render', {
        type: 'cone',
        material: rockMat,
      });
      rock.setLocalScale(3 * pos.scale, 5 * pos.scale, 3 * pos.scale);
      rock.setPosition(pos.x, -3.5, pos.z);
      rock.setEulerAngles(180 + pos.rot, i * 30, pos.rot);
    });

    // Grass patches on top
    this.createGrassPatches();

    // Flowers and small details
    this.createFlowers();

    // Path/trail on island
    this.createPath();
  }

  /**
   * Create dirt material
   */
  private createDirtMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.45, 0.32, 0.22);
    material.specular = new pc.Color(0.2, 0.15, 0.1);
    material.gloss = 0.3;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create grass patches for variety
   */
  private createGrassPatches(): void {
    const grassMat = this.createGrassMaterial();
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 4 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const patch = this.engine.createEntity(`GrassPatch_${i}`, this.island);
      patch.addComponent('render', {
        type: 'sphere',
        material: grassMat,
      });
      const scale = 0.8 + Math.random() * 0.6;
      patch.setLocalScale(scale, 0.2, scale);
      patch.setPosition(x, 0.4, z);
    }
  }

  /**
   * Create decorative flowers
   */
  private createFlowers(): void {
    const flowerColors = [
      new pc.Color(1, 0.4, 0.5),    // Pink
      new pc.Color(1, 0.9, 0.3),    // Yellow
      new pc.Color(0.6, 0.4, 1),    // Purple
      new pc.Color(1, 0.6, 0.3),    // Orange
      new pc.Color(0.4, 0.7, 1),    // Blue
    ];

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const flower = this.engine.createEntity(`Flower_${i}`, this.island);
      
      const flowerMat = new pc.StandardMaterial();
      flowerMat.diffuse = flowerColors[i % flowerColors.length];
      flowerMat.emissive = new pc.Color(
        flowerColors[i % flowerColors.length].r * 0.2,
        flowerColors[i % flowerColors.length].g * 0.2,
        flowerColors[i % flowerColors.length].b * 0.2
      );
      flowerMat.gloss = 0.7;
      flowerMat.update();

      flower.addComponent('render', {
        type: 'sphere',
        material: flowerMat,
      });
      const scale = 0.15 + Math.random() * 0.15;
      flower.setLocalScale(scale, scale, scale);
      flower.setPosition(x, 0.6 + Math.random() * 0.3, z);
    }
  }

  /**
   * Create a winding path on the island
   */
  private createPath(): void {
    const pathMat = new pc.StandardMaterial();
    pathMat.diffuse = new pc.Color(0.7, 0.6, 0.45);
    pathMat.specular = new pc.Color(0.3, 0.25, 0.2);
    pathMat.gloss = 0.4;
    pathMat.update();

    // Path segments
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const angle = t * Math.PI * 1.5;
      const radius = 1 + t * 2.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pathSeg = this.engine.createEntity(`Path_${i}`, this.island);
      pathSeg.addComponent('render', {
        type: 'cylinder',
        material: pathMat,
      });
      pathSeg.setLocalScale(0.6 + t * 0.3, 0.05, 0.6 + t * 0.3);
      pathSeg.setPosition(x, 0.42, z);
    }
  }

  /**
   * Create island ground material - Lush green with texture
   */
  private createIslandMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.35, 0.75, 0.4);
    material.diffuseMap = this.textureGen.createGrassTexture();
    material.diffuseMapTiling = new pc.Vec2(3, 3);
    material.specular = new pc.Color(0.3, 0.4, 0.3);
    material.gloss = 0.5;
    material.metalness = 0.0;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create rock material - Stylized purple/blue rocks with texture
   */
  private createRockMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.5, 0.45, 0.6);
    material.diffuseMap = this.textureGen.createRockTexture();
    material.diffuseMapTiling = new pc.Vec2(2, 2);
    material.specular = new pc.Color(0.5, 0.4, 0.6);
    material.gloss = 0.6;
    material.metalness = 0.1;
    material.useMetalness = true;
    material.update();
    return material;
  }

  /**
   * Create grass material - Vibrant cartoon grass with texture
   */
  private createGrassMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.3, 0.85, 0.45);
    material.diffuseMap = this.textureGen.createGrassTexture();
    material.diffuseMapTiling = new pc.Vec2(4, 4);
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
   * Create stylized water material - Magical glowing water with texture
   */
  private createWaterMaterial(): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.2, 0.5, 0.8);
    material.diffuseMap = this.textureGen.createWaterTexture();
    material.diffuseMapTiling = new pc.Vec2(8, 8);
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
    // Create variety of beautiful trees
    const treeConfigs: Array<{ x: number; z: number; scale: number; style: TreeStyle }> = [
      { x: 3.5, z: 3, scale: 0.9, style: 'round' },
      { x: -4, z: 2.5, scale: 1.0, style: 'pine' },
      { x: 2.5, z: -4, scale: 0.85, style: 'palm' },
      { x: -3.5, z: -3.5, scale: 0.95, style: 'round' },
      { x: 4.5, z: -1, scale: 0.8, style: 'willow' },
      { x: -4.5, z: -1.5, scale: 0.75, style: 'mushroom' },
      { x: 0, z: 4.5, scale: 0.85, style: 'pine' },
      { x: -2, z: -5, scale: 0.7, style: 'mushroom' },
    ];

    treeConfigs.forEach((config, i) => {
      const tree = this.treeGen.createTree(config.style, this.root);
      tree.name = `Tree_${i}_${config.style}`;
      tree.setPosition(config.x, 0.4, config.z);
      tree.setLocalScale(config.scale, config.scale, config.scale);
    });

    // Add decorative crystals
    this.createCrystals();

    // Add floating rings around island
    this.createFloatingRings();

    // Create collectible placeholders (will be replaced with 3D words)
    this.createPlaceholderCollectibles();
  }

  /**
   * Create decorative crystals with textures
   */
  private createCrystals(): void {
    const crystalPositions = [
      { x: -5, z: 0, color: new pc.Color(0.4, 0.8, 1), hue: 200 },
      { x: 5, z: -2, color: new pc.Color(1, 0.5, 0.8), hue: 320 },
      { x: 0, z: 5, color: new pc.Color(0.6, 1, 0.7), hue: 140 },
      { x: -3, z: 4.5, color: new pc.Color(1, 0.8, 0.3), hue: 45 },
      { x: 4, z: 3, color: new pc.Color(0.8, 0.4, 1), hue: 280 },
    ];

    crystalPositions.forEach((pos, i) => {
      // Main crystal
      const crystal = this.engine.createEntity(`Crystal_${i}`, this.root);
      
      const material = new pc.StandardMaterial();
      material.diffuse = pos.color;
      material.diffuseMap = this.textureGen.createCrystalTexture(pos.hue);
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
      const scale = 0.3 + Math.random() * 0.3;
      crystal.setLocalScale(scale, 0.8 + Math.random() * 0.8, scale);

      // Add smaller crystal beside it
      if (i < 3) {
        const smallCrystal = this.engine.createEntity(`SmallCrystal_${i}`, this.root);
        smallCrystal.addComponent('render', {
          type: 'cone',
          material: material,
        });
        smallCrystal.setPosition(pos.x + 0.4, 0.2, pos.z + 0.3);
        smallCrystal.setLocalScale(scale * 0.5, scale * 1.5, scale * 0.5);
        smallCrystal.setEulerAngles(0, 0, 15);
      }
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
