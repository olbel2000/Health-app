/**
 * Beautiful Stylized Tree Generator
 * Creates cartoon/vinyl toy style trees for Lingo Island
 */

import * as pc from 'playcanvas';
import { Engine } from '../core/Engine';
import { TextureGenerator } from '../services/TextureGenerator';

export type TreeStyle = 'round' | 'pine' | 'palm' | 'willow' | 'mushroom';

interface TreeConfig {
  style: TreeStyle;
  trunkColor: pc.Color;
  foliageColors: pc.Color[];
  trunkHeight: number;
  foliageSize: number;
  hasFlowers?: boolean;
  flowerColor?: pc.Color;
}

const TREE_PRESETS: Record<TreeStyle, Partial<TreeConfig>> = {
  'round': {
    trunkColor: new pc.Color(0.5, 0.35, 0.25),
    foliageColors: [
      new pc.Color(0.2, 0.7, 0.35),
      new pc.Color(0.25, 0.75, 0.4),
      new pc.Color(0.3, 0.8, 0.45),
    ],
    trunkHeight: 1.8,
    foliageSize: 1.3,
  },
  'pine': {
    trunkColor: new pc.Color(0.45, 0.3, 0.2),
    foliageColors: [
      new pc.Color(0.15, 0.45, 0.25),
      new pc.Color(0.18, 0.5, 0.28),
      new pc.Color(0.2, 0.55, 0.3),
    ],
    trunkHeight: 2.2,
    foliageSize: 1.0,
  },
  'palm': {
    trunkColor: new pc.Color(0.55, 0.4, 0.25),
    foliageColors: [
      new pc.Color(0.25, 0.65, 0.3),
      new pc.Color(0.3, 0.7, 0.35),
    ],
    trunkHeight: 2.5,
    foliageSize: 1.5,
  },
  'willow': {
    trunkColor: new pc.Color(0.4, 0.32, 0.22),
    foliageColors: [
      new pc.Color(0.35, 0.75, 0.4),
      new pc.Color(0.4, 0.8, 0.45),
    ],
    trunkHeight: 2.0,
    foliageSize: 1.6,
  },
  'mushroom': {
    trunkColor: new pc.Color(0.9, 0.85, 0.75),
    foliageColors: [
      new pc.Color(0.9, 0.3, 0.35),
      new pc.Color(0.95, 0.35, 0.4),
    ],
    trunkHeight: 1.2,
    foliageSize: 1.4,
    hasFlowers: true,
    flowerColor: new pc.Color(1, 1, 0.9),
  },
};

export class TreeGenerator {
  private textureGen: TextureGenerator;

  constructor() {
    // Ensure Engine is initialized
    Engine.getInstance();
    this.textureGen = TextureGenerator.getInstance();
  }

  /**
   * Create a beautiful stylized tree
   */
  createTree(style: TreeStyle, parent?: pc.Entity): pc.Entity {
    const config = { style, ...TREE_PRESETS[style] } as TreeConfig;
    
    switch (style) {
      case 'round':
        return this.createRoundTree(config, parent);
      case 'pine':
        return this.createPineTree(config, parent);
      case 'palm':
        return this.createPalmTree(config, parent);
      case 'willow':
        return this.createWillowTree(config, parent);
      case 'mushroom':
        return this.createMushroomTree(config, parent);
      default:
        return this.createRoundTree(config, parent);
    }
  }

  /**
   * Create trunk material with bark texture
   */
  private createTrunkMaterial(color: pc.Color): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = color;
    material.diffuseMap = this.textureGen.createBarkTexture();
    material.diffuseMapTiling = new pc.Vec2(1, 2);
    material.specular = new pc.Color(0.3, 0.25, 0.2);
    material.gloss = 0.4;
    material.update();
    return material;
  }

  /**
   * Create foliage material with gradient
   */
  private createFoliageMaterial(color: pc.Color, glow: number = 0): pc.StandardMaterial {
    const material = new pc.StandardMaterial();
    material.diffuse = color;
    material.diffuseMap = this.textureGen.createFoliageTexture();
    material.specular = new pc.Color(0.5, 0.6, 0.5);
    material.gloss = 0.65;
    if (glow > 0) {
      material.emissive = new pc.Color(color.r * glow, color.g * glow, color.b * glow);
    }
    material.update();
    return material;
  }

  /**
   * Round cartoon tree (like in Mario)
   */
  private createRoundTree(config: TreeConfig, parent?: pc.Entity): pc.Entity {
    const tree = new pc.Entity('RoundTree');
    if (parent) parent.addChild(tree);

    const trunkMat = this.createTrunkMaterial(config.trunkColor);

    // Trunk - curved cylinder effect
    const trunk = new pc.Entity('Trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.22, config.trunkHeight, 0.22);
    trunk.setPosition(0, config.trunkHeight / 2, 0);
    tree.addChild(trunk);

    // Trunk base bulge
    const trunkBase = new pc.Entity('TrunkBase');
    trunkBase.addComponent('render', { type: 'sphere', material: trunkMat });
    trunkBase.setLocalScale(0.35, 0.25, 0.35);
    trunkBase.setPosition(0, 0.1, 0);
    tree.addChild(trunkBase);

    // Multiple foliage spheres for fluffy look
    const foliagePositions = [
      { x: 0, y: config.trunkHeight + 0.6, z: 0, scale: config.foliageSize },
      { x: 0.4, y: config.trunkHeight + 0.3, z: 0.3, scale: config.foliageSize * 0.7 },
      { x: -0.35, y: config.trunkHeight + 0.4, z: 0.25, scale: config.foliageSize * 0.65 },
      { x: 0.2, y: config.trunkHeight + 0.35, z: -0.4, scale: config.foliageSize * 0.6 },
      { x: -0.25, y: config.trunkHeight + 0.25, z: -0.35, scale: config.foliageSize * 0.55 },
      { x: 0, y: config.trunkHeight + 1.0, z: 0, scale: config.foliageSize * 0.6 },
    ];

    foliagePositions.forEach((pos, i) => {
      const foliage = new pc.Entity(`Foliage_${i}`);
      const colorIndex = i % config.foliageColors.length;
      const mat = this.createFoliageMaterial(config.foliageColors[colorIndex], 0.05);
      
      foliage.addComponent('render', { type: 'sphere', material: mat });
      foliage.setLocalScale(pos.scale, pos.scale * 0.85, pos.scale);
      foliage.setPosition(pos.x, pos.y, pos.z);
      tree.addChild(foliage);
    });

    return tree;
  }

  /**
   * Pine/Christmas tree style
   */
  private createPineTree(config: TreeConfig, parent?: pc.Entity): pc.Entity {
    const tree = new pc.Entity('PineTree');
    if (parent) parent.addChild(tree);

    const trunkMat = this.createTrunkMaterial(config.trunkColor);

    // Trunk
    const trunk = new pc.Entity('Trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.18, config.trunkHeight, 0.18);
    trunk.setPosition(0, config.trunkHeight / 2, 0);
    tree.addChild(trunk);

    // Layered cone foliage
    const layers = [
      { y: config.trunkHeight - 0.2, scale: 1.3, height: 1.0 },
      { y: config.trunkHeight + 0.5, scale: 1.0, height: 0.9 },
      { y: config.trunkHeight + 1.1, scale: 0.7, height: 0.8 },
      { y: config.trunkHeight + 1.6, scale: 0.4, height: 0.6 },
    ];

    layers.forEach((layer, i) => {
      const foliage = new pc.Entity(`PineLayer_${i}`);
      const colorIndex = i % config.foliageColors.length;
      const mat = this.createFoliageMaterial(config.foliageColors[colorIndex]);
      
      foliage.addComponent('render', { type: 'cone', material: mat });
      foliage.setLocalScale(layer.scale * config.foliageSize, layer.height, layer.scale * config.foliageSize);
      foliage.setPosition(0, layer.y, 0);
      tree.addChild(foliage);
    });

    return tree;
  }

  /**
   * Tropical palm tree
   */
  private createPalmTree(config: TreeConfig, parent?: pc.Entity): pc.Entity {
    const tree = new pc.Entity('PalmTree');
    if (parent) parent.addChild(tree);

    const trunkMat = this.createTrunkMaterial(config.trunkColor);

    // Curved trunk using multiple segments
    const segments = 5;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const segment = new pc.Entity(`TrunkSeg_${i}`);
      segment.addComponent('render', { type: 'cylinder', material: trunkMat });
      
      const segHeight = config.trunkHeight / segments;
      const curve = Math.sin(t * Math.PI * 0.3) * 0.3;
      
      segment.setLocalScale(0.2 - t * 0.05, segHeight + 0.1, 0.2 - t * 0.05);
      segment.setPosition(curve, segHeight * i + segHeight / 2, 0);
      segment.setEulerAngles(0, 0, -curve * 20);
      tree.addChild(segment);
    }

    // Palm fronds (leaves)
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frond = new pc.Entity(`Frond_${i}`);
      
      const mat = this.createFoliageMaterial(
        config.foliageColors[i % config.foliageColors.length],
        0.03
      );
      
      frond.addComponent('render', { type: 'box', material: mat });
      frond.setLocalScale(0.15, 0.05, 1.2);
      
      const x = Math.cos(angle) * 0.3;
      const z = Math.sin(angle) * 0.3;
      frond.setPosition(x, config.trunkHeight, z);
      frond.setEulerAngles(-30, angle * 180 / Math.PI, 0);
      tree.addChild(frond);
    }

    // Coconuts
    for (let i = 0; i < 3; i++) {
      const coconut = new pc.Entity(`Coconut_${i}`);
      const coconutMat = new pc.StandardMaterial();
      coconutMat.diffuse = new pc.Color(0.4, 0.25, 0.15);
      coconutMat.gloss = 0.5;
      coconutMat.update();
      
      coconut.addComponent('render', { type: 'sphere', material: coconutMat });
      coconut.setLocalScale(0.12, 0.12, 0.12);
      
      const angle = (i / 3) * Math.PI * 2;
      coconut.setPosition(
        Math.cos(angle) * 0.15,
        config.trunkHeight - 0.15,
        Math.sin(angle) * 0.15
      );
      tree.addChild(coconut);
    }

    return tree;
  }

  /**
   * Weeping willow style
   */
  private createWillowTree(config: TreeConfig, parent?: pc.Entity): pc.Entity {
    const tree = new pc.Entity('WillowTree');
    if (parent) parent.addChild(tree);

    const trunkMat = this.createTrunkMaterial(config.trunkColor);

    // Main trunk
    const trunk = new pc.Entity('Trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.25, config.trunkHeight, 0.25);
    trunk.setPosition(0, config.trunkHeight / 2, 0);
    tree.addChild(trunk);

    // Main foliage dome
    const mainFoliage = new pc.Entity('MainFoliage');
    const mainMat = this.createFoliageMaterial(config.foliageColors[0]);
    mainFoliage.addComponent('render', { type: 'sphere', material: mainMat });
    mainFoliage.setLocalScale(config.foliageSize * 1.2, config.foliageSize * 0.8, config.foliageSize * 1.2);
    mainFoliage.setPosition(0, config.trunkHeight + 0.3, 0);
    tree.addChild(mainFoliage);

    // Hanging vines/branches
    const vineCount = 12;
    for (let i = 0; i < vineCount; i++) {
      const angle = (i / vineCount) * Math.PI * 2;
      const vine = new pc.Entity(`Vine_${i}`);
      
      const vineMat = this.createFoliageMaterial(
        config.foliageColors[i % config.foliageColors.length],
        0.02
      );
      
      vine.addComponent('render', { type: 'cylinder', material: vineMat });
      
      const length = 0.8 + Math.random() * 0.6;
      vine.setLocalScale(0.06, length, 0.06);
      
      const radius = config.foliageSize * 0.8;
      vine.setPosition(
        Math.cos(angle) * radius,
        config.trunkHeight - length / 2 + 0.3,
        Math.sin(angle) * radius
      );
      tree.addChild(vine);
    }

    return tree;
  }

  /**
   * Fantasy mushroom tree
   */
  private createMushroomTree(config: TreeConfig, parent?: pc.Entity): pc.Entity {
    const tree = new pc.Entity('MushroomTree');
    if (parent) parent.addChild(tree);

    // Stem (trunk)
    const stemMat = new pc.StandardMaterial();
    stemMat.diffuse = config.trunkColor;
    stemMat.specular = new pc.Color(0.4, 0.4, 0.4);
    stemMat.gloss = 0.6;
    stemMat.update();

    const stem = new pc.Entity('Stem');
    stem.addComponent('render', { type: 'cylinder', material: stemMat });
    stem.setLocalScale(0.3, config.trunkHeight, 0.3);
    stem.setPosition(0, config.trunkHeight / 2, 0);
    tree.addChild(stem);

    // Mushroom cap
    const capMat = new pc.StandardMaterial();
    capMat.diffuse = config.foliageColors[0];
    capMat.emissive = new pc.Color(
      config.foliageColors[0].r * 0.15,
      config.foliageColors[0].g * 0.15,
      config.foliageColors[0].b * 0.15
    );
    capMat.specular = new pc.Color(0.8, 0.7, 0.7);
    capMat.gloss = 0.85;
    capMat.update();

    const cap = new pc.Entity('Cap');
    cap.addComponent('render', { type: 'sphere', material: capMat });
    cap.setLocalScale(config.foliageSize * 1.5, config.foliageSize * 0.7, config.foliageSize * 1.5);
    cap.setPosition(0, config.trunkHeight + 0.1, 0);
    tree.addChild(cap);

    // Spots on cap
    if (config.hasFlowers && config.flowerColor) {
      const spotCount = 8;
      for (let i = 0; i < spotCount; i++) {
        const spot = new pc.Entity(`Spot_${i}`);
        
        const spotMat = new pc.StandardMaterial();
        spotMat.diffuse = config.flowerColor;
        spotMat.emissive = new pc.Color(0.2, 0.2, 0.15);
        spotMat.gloss = 0.9;
        spotMat.update();
        
        spot.addComponent('render', { type: 'sphere', material: spotMat });
        spot.setLocalScale(0.15, 0.08, 0.15);
        
        const angle = (i / spotCount) * Math.PI * 2 + Math.random() * 0.3;
        const height = 0.1 + Math.random() * 0.3;
        const radius = config.foliageSize * (0.4 + height * 0.8);
        
        spot.setPosition(
          Math.cos(angle) * radius,
          config.trunkHeight + height,
          Math.sin(angle) * radius
        );
        tree.addChild(spot);
      }
    }

    // Glow ring at base
    const glowRing = new pc.Entity('GlowRing');
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = new pc.Color(0.5, 0.9, 0.6);
    glowMat.emissive = new pc.Color(0.1, 0.3, 0.15);
    glowMat.opacity = 0.5;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();
    
    glowRing.addComponent('render', { type: 'torus', material: glowMat });
    glowRing.setLocalScale(0.5, 0.5, 0.1);
    glowRing.setPosition(0, 0.05, 0);
    glowRing.setEulerAngles(90, 0, 0);
    tree.addChild(glowRing);

    return tree;
  }

  /**
   * Create a random tree
   */
  createRandomTree(parent?: pc.Entity): pc.Entity {
    const styles: TreeStyle[] = ['round', 'pine', 'palm', 'willow', 'mushroom'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    return this.createTree(randomStyle, parent);
  }
}

export default TreeGenerator;
