/**
 * Word Model Generator
 * Creates beautiful stylized 3D models for vocabulary words
 * Style: "Nano Banana" - glossy, cute, cartoon-like
 */

import * as pc from 'playcanvas';

type WordModelCreator = () => pc.Entity;

export class WordModelGenerator {
  private modelCreators: Map<string, WordModelCreator> = new Map();

  constructor() {
    this.registerAllModels();
  }

  /**
   * Register all word models
   */
  private registerAllModels(): void {
    // Fruits
    this.modelCreators.set('apple', () => this.createApple());
    this.modelCreators.set('banana', () => this.createBanana());
    this.modelCreators.set('orange', () => this.createOrange());
    this.modelCreators.set('grape', () => this.createGrape());
    this.modelCreators.set('strawberry', () => this.createStrawberry());

    // Animals
    this.modelCreators.set('cat', () => this.createCat());
    this.modelCreators.set('dog', () => this.createDog());
    this.modelCreators.set('elephant', () => this.createElephant());
    this.modelCreators.set('bird', () => this.createBird());
    this.modelCreators.set('fish', () => this.createFish());

    // Shapes & Objects
    this.modelCreators.set('star', () => this.createStar());
    this.modelCreators.set('heart', () => this.createHeart());
    this.modelCreators.set('house', () => this.createHouse());
    this.modelCreators.set('car', () => this.createCar());
    this.modelCreators.set('ball', () => this.createBall());
    this.modelCreators.set('book', () => this.createBook());
    
    // Nature
    this.modelCreators.set('sun', () => this.createSun());
    this.modelCreators.set('moon', () => this.createMoon());
    this.modelCreators.set('flower', () => this.createFlower());
    this.modelCreators.set('tree', () => this.createTreeModel());
  }

  /**
   * Check if we have a model for this word
   */
  hasModel(word: string): boolean {
    return this.modelCreators.has(word.toLowerCase());
  }

  /**
   * Get model for a word
   */
  getModel(word: string): pc.Entity | null {
    const creator = this.modelCreators.get(word.toLowerCase());
    if (creator) {
      return creator();
    }
    return null;
  }

  /**
   * Get list of available words
   */
  getAvailableWords(): string[] {
    return Array.from(this.modelCreators.keys());
  }

  /**
   * Create a glossy material in Nano Banana style
   */
  private createMaterial(
    color: pc.Color,
    emissiveIntensity: number = 0.1,
    metalness: number = 0.2
  ): pc.StandardMaterial {
    const mat = new pc.StandardMaterial();
    mat.diffuse = color;
    mat.emissive = new pc.Color(
      color.r * emissiveIntensity,
      color.g * emissiveIntensity,
      color.b * emissiveIntensity
    );
    mat.specular = new pc.Color(1, 1, 1);
    mat.gloss = 0.9;
    mat.metalness = metalness;
    mat.useMetalness = true;
    mat.update();
    return mat;
  }

  // =============================================
  // FRUITS
  // =============================================

  private createApple(): pc.Entity {
    const apple = new pc.Entity('Apple');
    
    // Main body
    const body = new pc.Entity('Body');
    const bodyMat = this.createMaterial(new pc.Color(0.9, 0.15, 0.15));
    body.addComponent('render', { type: 'sphere', material: bodyMat });
    body.setLocalScale(1, 0.9, 1);
    apple.addChild(body);

    // Top indent
    const indent = new pc.Entity('Indent');
    const indentMat = this.createMaterial(new pc.Color(0.7, 0.1, 0.1));
    indent.addComponent('render', { type: 'sphere', material: indentMat });
    indent.setLocalScale(0.3, 0.15, 0.3);
    indent.setPosition(0, 0.4, 0);
    apple.addChild(indent);

    // Stem
    const stem = new pc.Entity('Stem');
    const stemMat = this.createMaterial(new pc.Color(0.4, 0.25, 0.1));
    stem.addComponent('render', { type: 'cylinder', material: stemMat });
    stem.setLocalScale(0.08, 0.25, 0.08);
    stem.setPosition(0, 0.55, 0);
    apple.addChild(stem);

    // Leaf
    const leaf = new pc.Entity('Leaf');
    const leafMat = this.createMaterial(new pc.Color(0.2, 0.7, 0.2));
    leaf.addComponent('render', { type: 'sphere', material: leafMat });
    leaf.setLocalScale(0.25, 0.08, 0.15);
    leaf.setPosition(0.15, 0.6, 0);
    leaf.setEulerAngles(0, 0, -30);
    apple.addChild(leaf);

    // Highlight
    const highlight = new pc.Entity('Highlight');
    const highlightMat = new pc.StandardMaterial();
    highlightMat.diffuse = new pc.Color(1, 1, 1);
    highlightMat.opacity = 0.3;
    highlightMat.blendType = pc.BLEND_ADDITIVE;
    highlightMat.update();
    highlight.addComponent('render', { type: 'sphere', material: highlightMat });
    highlight.setLocalScale(0.2, 0.15, 0.1);
    highlight.setPosition(-0.25, 0.2, 0.35);
    apple.addChild(highlight);

    return apple;
  }

  private createBanana(): pc.Entity {
    const banana = new pc.Entity('Banana');
    const bananaColor = new pc.Color(1, 0.85, 0.2);
    const mat = this.createMaterial(bananaColor);

    // Create curved banana using multiple segments
    const segments = 5;
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const angle = (t - 0.5) * Math.PI * 0.6;
      
      const segment = new pc.Entity(`Segment_${i}`);
      segment.addComponent('render', { type: 'sphere', material: mat });
      
      const x = Math.sin(angle) * 0.8;
      const y = Math.cos(angle) * 0.3 - 0.1;
      const scale = 0.25 + Math.sin(t * Math.PI) * 0.1;
      
      segment.setPosition(x, y, 0);
      segment.setLocalScale(scale, 0.2, 0.2);
      banana.addChild(segment);
    }

    // Tips
    const tipMat = this.createMaterial(new pc.Color(0.45, 0.35, 0.15));
    
    const tip1 = new pc.Entity('Tip1');
    tip1.addComponent('render', { type: 'cone', material: tipMat });
    tip1.setLocalScale(0.1, 0.15, 0.1);
    tip1.setPosition(-0.7, -0.05, 0);
    tip1.setEulerAngles(0, 0, 60);
    banana.addChild(tip1);

    const tip2 = new pc.Entity('Tip2');
    tip2.addComponent('render', { type: 'sphere', material: tipMat });
    tip2.setLocalScale(0.12, 0.1, 0.1);
    tip2.setPosition(0.75, 0.1, 0);
    banana.addChild(tip2);

    banana.setEulerAngles(0, 0, 15);
    return banana;
  }

  private createOrange(): pc.Entity {
    const orange = new pc.Entity('Orange');
    const mat = this.createMaterial(new pc.Color(1, 0.6, 0.1));

    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'sphere', material: mat });
    orange.addChild(body);

    // Navel
    const navelMat = this.createMaterial(new pc.Color(0.9, 0.5, 0.05));
    const navel = new pc.Entity('Navel');
    navel.addComponent('render', { type: 'sphere', material: navelMat });
    navel.setLocalScale(0.15, 0.08, 0.15);
    navel.setPosition(0, -0.45, 0);
    orange.addChild(navel);

    // Leaf
    const leafMat = this.createMaterial(new pc.Color(0.2, 0.6, 0.15));
    const leaf = new pc.Entity('Leaf');
    leaf.addComponent('render', { type: 'sphere', material: leafMat });
    leaf.setLocalScale(0.2, 0.05, 0.12);
    leaf.setPosition(0, 0.5, 0);
    orange.addChild(leaf);

    return orange;
  }

  private createGrape(): pc.Entity {
    const grape = new pc.Entity('Grape');
    const mat = this.createMaterial(new pc.Color(0.5, 0.2, 0.6));

    const positions = [
      { x: 0, y: 0, z: 0 },
      { x: 0.25, y: 0.1, z: 0 },
      { x: -0.25, y: 0.1, z: 0 },
      { x: 0.12, y: 0.3, z: 0.1 },
      { x: -0.12, y: 0.3, z: 0.1 },
      { x: 0, y: 0.5, z: 0 },
      { x: 0, y: 0.1, z: 0.2 },
      { x: 0, y: 0.1, z: -0.15 },
    ];

    positions.forEach((pos, i) => {
      const ball = new pc.Entity(`Grape_${i}`);
      ball.addComponent('render', { type: 'sphere', material: mat });
      ball.setLocalScale(0.25, 0.25, 0.25);
      ball.setPosition(pos.x, pos.y - 0.2, pos.z);
      grape.addChild(ball);
    });

    // Stem
    const stemMat = this.createMaterial(new pc.Color(0.4, 0.3, 0.2));
    const stem = new pc.Entity('Stem');
    stem.addComponent('render', { type: 'cylinder', material: stemMat });
    stem.setLocalScale(0.05, 0.2, 0.05);
    stem.setPosition(0, 0.45, 0);
    grape.addChild(stem);

    return grape;
  }

  private createStrawberry(): pc.Entity {
    const strawberry = new pc.Entity('Strawberry');
    
    // Body
    const bodyMat = this.createMaterial(new pc.Color(0.9, 0.15, 0.2));
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'cone', material: bodyMat });
    body.setLocalScale(0.6, 0.9, 0.6);
    body.setEulerAngles(180, 0, 0);
    strawberry.addChild(body);

    // Top sphere
    const top = new pc.Entity('Top');
    top.addComponent('render', { type: 'sphere', material: bodyMat });
    top.setLocalScale(0.6, 0.3, 0.6);
    top.setPosition(0, 0.3, 0);
    strawberry.addChild(top);

    // Leaves
    const leafMat = this.createMaterial(new pc.Color(0.2, 0.6, 0.15));
    for (let i = 0; i < 5; i++) {
      const leaf = new pc.Entity(`Leaf_${i}`);
      leaf.addComponent('render', { type: 'sphere', material: leafMat });
      leaf.setLocalScale(0.15, 0.04, 0.08);
      const angle = (i / 5) * Math.PI * 2;
      leaf.setPosition(Math.cos(angle) * 0.15, 0.45, Math.sin(angle) * 0.15);
      leaf.setEulerAngles(20, angle * 180 / Math.PI, 0);
      strawberry.addChild(leaf);
    }

    // Seeds
    const seedMat = this.createMaterial(new pc.Color(1, 0.95, 0.5));
    for (let i = 0; i < 12; i++) {
      const seed = new pc.Entity(`Seed_${i}`);
      seed.addComponent('render', { type: 'sphere', material: seedMat });
      seed.setLocalScale(0.05, 0.03, 0.03);
      const angle = (i / 6) * Math.PI * 2;
      const y = -0.1 - (i % 2) * 0.25;
      const radius = 0.25 - Math.abs(y) * 0.3;
      seed.setPosition(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      strawberry.addChild(seed);
    }

    return strawberry;
  }

  // =============================================
  // ANIMALS
  // =============================================

  private createCat(): pc.Entity {
    const cat = new pc.Entity('Cat');
    const bodyColor = new pc.Color(1, 0.6, 0.3); // Orange cat
    const mat = this.createMaterial(bodyColor);

    // Body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'capsule', material: mat });
    body.setLocalScale(0.5, 0.4, 0.4);
    body.setPosition(0, 0.2, 0);
    body.setEulerAngles(0, 0, 90);
    cat.addChild(body);

    // Head
    const head = new pc.Entity('Head');
    head.addComponent('render', { type: 'sphere', material: mat });
    head.setLocalScale(0.45, 0.4, 0.4);
    head.setPosition(0.35, 0.35, 0);
    cat.addChild(head);

    // Ears
    const earMat = this.createMaterial(new pc.Color(1, 0.5, 0.25));
    [-0.12, 0.12].forEach((z, i) => {
      const ear = new pc.Entity(`Ear_${i}`);
      ear.addComponent('render', { type: 'cone', material: earMat });
      ear.setLocalScale(0.1, 0.15, 0.08);
      ear.setPosition(0.4, 0.55, z);
      cat.addChild(ear);
    });

    // Eyes
    const eyeMat = this.createMaterial(new pc.Color(0.2, 0.8, 0.3));
    const pupilMat = this.createMaterial(new pc.Color(0.05, 0.05, 0.05));
    [-0.08, 0.08].forEach((z, i) => {
      const eye = new pc.Entity(`Eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.1, 0.1, 0.08);
      eye.setPosition(0.5, 0.4, z);
      cat.addChild(eye);

      const pupil = new pc.Entity(`Pupil_${i}`);
      pupil.addComponent('render', { type: 'sphere', material: pupilMat });
      pupil.setLocalScale(0.04, 0.08, 0.04);
      pupil.setPosition(0.54, 0.4, z);
      cat.addChild(pupil);
    });

    // Nose
    const noseMat = this.createMaterial(new pc.Color(1, 0.5, 0.5));
    const nose = new pc.Entity('Nose');
    nose.addComponent('render', { type: 'sphere', material: noseMat });
    nose.setLocalScale(0.06, 0.05, 0.06);
    nose.setPosition(0.55, 0.32, 0);
    cat.addChild(nose);

    // Tail
    const tail = new pc.Entity('Tail');
    tail.addComponent('render', { type: 'capsule', material: mat });
    tail.setLocalScale(0.08, 0.35, 0.08);
    tail.setPosition(-0.4, 0.4, 0);
    tail.setEulerAngles(0, 0, 45);
    cat.addChild(tail);

    return cat;
  }

  private createDog(): pc.Entity {
    const dog = new pc.Entity('Dog');
    const bodyColor = new pc.Color(0.7, 0.5, 0.3); // Brown dog
    const mat = this.createMaterial(bodyColor);

    // Body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'capsule', material: mat });
    body.setLocalScale(0.55, 0.45, 0.45);
    body.setPosition(0, 0.25, 0);
    body.setEulerAngles(0, 0, 90);
    dog.addChild(body);

    // Head
    const head = new pc.Entity('Head');
    head.addComponent('render', { type: 'sphere', material: mat });
    head.setLocalScale(0.4, 0.38, 0.38);
    head.setPosition(0.4, 0.4, 0);
    dog.addChild(head);

    // Snout
    const snout = new pc.Entity('Snout');
    snout.addComponent('render', { type: 'capsule', material: mat });
    snout.setLocalScale(0.15, 0.12, 0.15);
    snout.setPosition(0.6, 0.35, 0);
    snout.setEulerAngles(0, 0, 90);
    dog.addChild(snout);

    // Nose
    const noseMat = this.createMaterial(new pc.Color(0.1, 0.1, 0.1));
    const nose = new pc.Entity('Nose');
    nose.addComponent('render', { type: 'sphere', material: noseMat });
    nose.setLocalScale(0.08, 0.06, 0.08);
    nose.setPosition(0.7, 0.37, 0);
    dog.addChild(nose);

    // Floppy ears
    const earMat = this.createMaterial(new pc.Color(0.5, 0.35, 0.2));
    [-0.18, 0.18].forEach((z, i) => {
      const ear = new pc.Entity(`Ear_${i}`);
      ear.addComponent('render', { type: 'sphere', material: earMat });
      ear.setLocalScale(0.12, 0.2, 0.08);
      ear.setPosition(0.35, 0.35, z);
      dog.addChild(ear);
    });

    // Eyes
    const eyeMat = this.createMaterial(new pc.Color(0.15, 0.1, 0.05));
    [-0.1, 0.1].forEach((z, i) => {
      const eye = new pc.Entity(`Eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.08, 0.08, 0.06);
      eye.setPosition(0.52, 0.45, z);
      dog.addChild(eye);
    });

    // Tail
    const tail = new pc.Entity('Tail');
    tail.addComponent('render', { type: 'capsule', material: mat });
    tail.setLocalScale(0.08, 0.25, 0.08);
    tail.setPosition(-0.4, 0.45, 0);
    tail.setEulerAngles(0, 0, 60);
    dog.addChild(tail);

    // Legs
    for (let i = 0; i < 4; i++) {
      const leg = new pc.Entity(`Leg_${i}`);
      leg.addComponent('render', { type: 'capsule', material: mat });
      leg.setLocalScale(0.1, 0.15, 0.1);
      const x = i < 2 ? 0.2 : -0.2;
      const z = i % 2 === 0 ? 0.15 : -0.15;
      leg.setPosition(x, 0, z);
      dog.addChild(leg);
    }

    return dog;
  }

  private createElephant(): pc.Entity {
    const elephant = new pc.Entity('Elephant');
    const mat = this.createMaterial(new pc.Color(0.6, 0.6, 0.65));

    // Body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'sphere', material: mat });
    body.setLocalScale(0.7, 0.55, 0.55);
    elephant.addChild(body);

    // Head
    const head = new pc.Entity('Head');
    head.addComponent('render', { type: 'sphere', material: mat });
    head.setLocalScale(0.45, 0.45, 0.4);
    head.setPosition(0.5, 0.15, 0);
    elephant.addChild(head);

    // Trunk
    for (let i = 0; i < 4; i++) {
      const segment = new pc.Entity(`Trunk_${i}`);
      segment.addComponent('render', { type: 'sphere', material: mat });
      const scale = 0.12 - i * 0.02;
      segment.setLocalScale(scale, scale, scale);
      segment.setPosition(0.7 + i * 0.08, -0.1 - i * 0.12, 0);
      elephant.addChild(segment);
    }

    // Ears
    const earMat = this.createMaterial(new pc.Color(0.55, 0.5, 0.55));
    [-0.25, 0.25].forEach((z, i) => {
      const ear = new pc.Entity(`Ear_${i}`);
      ear.addComponent('render', { type: 'sphere', material: earMat });
      ear.setLocalScale(0.25, 0.3, 0.05);
      ear.setPosition(0.35, 0.2, z);
      elephant.addChild(ear);
    });

    // Eyes
    const eyeMat = this.createMaterial(new pc.Color(0.1, 0.1, 0.1));
    [-0.12, 0.12].forEach((z, i) => {
      const eye = new pc.Entity(`Eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.06, 0.06, 0.04);
      eye.setPosition(0.65, 0.25, z);
      elephant.addChild(eye);
    });

    // Tusks
    const tuskMat = this.createMaterial(new pc.Color(1, 0.98, 0.9));
    [-0.1, 0.1].forEach((z, i) => {
      const tusk = new pc.Entity(`Tusk_${i}`);
      tusk.addComponent('render', { type: 'cone', material: tuskMat });
      tusk.setLocalScale(0.04, 0.2, 0.04);
      tusk.setPosition(0.6, -0.1, z);
      tusk.setEulerAngles(0, 0, 160);
      elephant.addChild(tusk);
    });

    // Legs
    for (let i = 0; i < 4; i++) {
      const leg = new pc.Entity(`Leg_${i}`);
      leg.addComponent('render', { type: 'cylinder', material: mat });
      leg.setLocalScale(0.15, 0.25, 0.15);
      const x = i < 2 ? 0.25 : -0.25;
      const z = i % 2 === 0 ? 0.2 : -0.2;
      leg.setPosition(x, -0.35, z);
      elephant.addChild(leg);
    }

    return elephant;
  }

  private createBird(): pc.Entity {
    const bird = new pc.Entity('Bird');
    const mat = this.createMaterial(new pc.Color(0.2, 0.6, 0.9));

    // Body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'sphere', material: mat });
    body.setLocalScale(0.4, 0.35, 0.35);
    bird.addChild(body);

    // Head
    const head = new pc.Entity('Head');
    head.addComponent('render', { type: 'sphere', material: mat });
    head.setLocalScale(0.28, 0.28, 0.28);
    head.setPosition(0.25, 0.2, 0);
    bird.addChild(head);

    // Beak
    const beakMat = this.createMaterial(new pc.Color(1, 0.7, 0.2));
    const beak = new pc.Entity('Beak');
    beak.addComponent('render', { type: 'cone', material: beakMat });
    beak.setLocalScale(0.08, 0.15, 0.06);
    beak.setPosition(0.4, 0.18, 0);
    beak.setEulerAngles(0, 0, -90);
    bird.addChild(beak);

    // Eyes
    const eyeMat = this.createMaterial(new pc.Color(0.05, 0.05, 0.05));
    [-0.08, 0.08].forEach((z, i) => {
      const eye = new pc.Entity(`Eye_${i}`);
      eye.addComponent('render', { type: 'sphere', material: eyeMat });
      eye.setLocalScale(0.05, 0.05, 0.04);
      eye.setPosition(0.35, 0.25, z);
      bird.addChild(eye);
    });

    // Wings
    const wingMat = this.createMaterial(new pc.Color(0.15, 0.5, 0.85));
    [-0.2, 0.2].forEach((z, i) => {
      const wing = new pc.Entity(`Wing_${i}`);
      wing.addComponent('render', { type: 'sphere', material: wingMat });
      wing.setLocalScale(0.25, 0.08, 0.15);
      wing.setPosition(-0.05, 0.05, z);
      wing.setEulerAngles(0, 0, z > 0 ? 30 : -30);
      bird.addChild(wing);
    });

    // Tail
    const tailMat = this.createMaterial(new pc.Color(0.1, 0.4, 0.75));
    const tail = new pc.Entity('Tail');
    tail.addComponent('render', { type: 'sphere', material: tailMat });
    tail.setLocalScale(0.15, 0.06, 0.2);
    tail.setPosition(-0.3, 0, 0);
    bird.addChild(tail);

    return bird;
  }

  private createFish(): pc.Entity {
    const fish = new pc.Entity('Fish');
    const mat = this.createMaterial(new pc.Color(1, 0.5, 0.2));

    // Body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'sphere', material: mat });
    body.setLocalScale(0.5, 0.3, 0.2);
    fish.addChild(body);

    // Tail
    const tailMat = this.createMaterial(new pc.Color(1, 0.4, 0.15));
    const tail = new pc.Entity('Tail');
    tail.addComponent('render', { type: 'cone', material: tailMat });
    tail.setLocalScale(0.2, 0.3, 0.05);
    tail.setPosition(-0.35, 0, 0);
    tail.setEulerAngles(0, 0, 90);
    fish.addChild(tail);

    // Fin
    const fin = new pc.Entity('Fin');
    fin.addComponent('render', { type: 'cone', material: tailMat });
    fin.setLocalScale(0.1, 0.2, 0.03);
    fin.setPosition(0, 0.2, 0);
    fish.addChild(fin);

    // Eye
    const eyeMat = this.createMaterial(new pc.Color(0.05, 0.05, 0.05));
    const eye = new pc.Entity('Eye');
    eye.addComponent('render', { type: 'sphere', material: eyeMat });
    eye.setLocalScale(0.08, 0.08, 0.06);
    eye.setPosition(0.2, 0.05, 0.08);
    fish.addChild(eye);

    // Scales pattern (decorative spheres)
    const scaleMat = this.createMaterial(new pc.Color(1, 0.6, 0.3));
    for (let i = 0; i < 3; i++) {
      const scale = new pc.Entity(`Scale_${i}`);
      scale.addComponent('render', { type: 'sphere', material: scaleMat });
      scale.setLocalScale(0.08, 0.06, 0.04);
      scale.setPosition(-0.1 + i * 0.12, -0.05, 0.09);
      fish.addChild(scale);
    }

    return fish;
  }

  // =============================================
  // SHAPES & OBJECTS
  // =============================================

  private createStar(): pc.Entity {
    const star = new pc.Entity('Star');
    const mat = this.createMaterial(new pc.Color(1, 0.85, 0.1), 0.3);

    // Center
    const center = new pc.Entity('Center');
    center.addComponent('render', { type: 'sphere', material: mat });
    center.setLocalScale(0.4, 0.4, 0.15);
    star.addChild(center);

    // 5 points
    for (let i = 0; i < 5; i++) {
      const point = new pc.Entity(`Point_${i}`);
      point.addComponent('render', { type: 'cone', material: mat });
      point.setLocalScale(0.2, 0.45, 0.12);
      
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      point.setPosition(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0);
      point.setEulerAngles(0, 0, (angle * 180 / Math.PI) - 90);
      star.addChild(point);
    }

    return star;
  }

  private createHeart(): pc.Entity {
    const heart = new pc.Entity('Heart');
    const mat = this.createMaterial(new pc.Color(1, 0.2, 0.35), 0.2);

    // Two top spheres
    [-0.2, 0.2].forEach((x, i) => {
      const lobe = new pc.Entity(`Lobe_${i}`);
      lobe.addComponent('render', { type: 'sphere', material: mat });
      lobe.setLocalScale(0.4, 0.4, 0.3);
      lobe.setPosition(x, 0.15, 0);
      heart.addChild(lobe);
    });

    // Bottom cone
    const bottom = new pc.Entity('Bottom');
    bottom.addComponent('render', { type: 'cone', material: mat });
    bottom.setLocalScale(0.55, 0.5, 0.3);
    bottom.setPosition(0, -0.15, 0);
    bottom.setEulerAngles(0, 0, 180);
    heart.addChild(bottom);

    // Highlight
    const highlightMat = new pc.StandardMaterial();
    highlightMat.diffuse = new pc.Color(1, 1, 1);
    highlightMat.opacity = 0.4;
    highlightMat.blendType = pc.BLEND_ADDITIVE;
    highlightMat.update();
    const highlight = new pc.Entity('Highlight');
    highlight.addComponent('render', { type: 'sphere', material: highlightMat });
    highlight.setLocalScale(0.12, 0.1, 0.08);
    highlight.setPosition(-0.15, 0.2, 0.12);
    heart.addChild(highlight);

    return heart;
  }

  private createHouse(): pc.Entity {
    const house = new pc.Entity('House');
    
    // Base
    const baseMat = this.createMaterial(new pc.Color(0.9, 0.85, 0.7));
    const base = new pc.Entity('Base');
    base.addComponent('render', { type: 'box', material: baseMat });
    base.setLocalScale(0.7, 0.5, 0.6);
    base.setPosition(0, 0.25, 0);
    house.addChild(base);

    // Roof
    const roofMat = this.createMaterial(new pc.Color(0.8, 0.3, 0.25));
    const roof = new pc.Entity('Roof');
    roof.addComponent('render', { type: 'cone', material: roofMat });
    roof.setLocalScale(0.9, 0.4, 0.75);
    roof.setPosition(0, 0.65, 0);
    house.addChild(roof);

    // Door
    const doorMat = this.createMaterial(new pc.Color(0.5, 0.3, 0.15));
    const door = new pc.Entity('Door');
    door.addComponent('render', { type: 'box', material: doorMat });
    door.setLocalScale(0.15, 0.25, 0.05);
    door.setPosition(0, 0.12, 0.3);
    house.addChild(door);

    // Windows
    const windowMat = this.createMaterial(new pc.Color(0.6, 0.85, 1), 0.2);
    [-0.18, 0.18].forEach((x, i) => {
      const window = new pc.Entity(`Window_${i}`);
      window.addComponent('render', { type: 'box', material: windowMat });
      window.setLocalScale(0.12, 0.12, 0.05);
      window.setPosition(x, 0.32, 0.3);
      house.addChild(window);
    });

    // Chimney
    const chimneyMat = this.createMaterial(new pc.Color(0.6, 0.25, 0.2));
    const chimney = new pc.Entity('Chimney');
    chimney.addComponent('render', { type: 'box', material: chimneyMat });
    chimney.setLocalScale(0.12, 0.25, 0.12);
    chimney.setPosition(0.2, 0.85, 0);
    house.addChild(chimney);

    return house;
  }

  private createCar(): pc.Entity {
    const car = new pc.Entity('Car');
    
    // Body
    const bodyMat = this.createMaterial(new pc.Color(0.9, 0.2, 0.25));
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'box', material: bodyMat });
    body.setLocalScale(0.8, 0.25, 0.4);
    body.setPosition(0, 0.2, 0);
    car.addChild(body);

    // Cabin
    const cabinMat = this.createMaterial(new pc.Color(0.75, 0.15, 0.2));
    const cabin = new pc.Entity('Cabin');
    cabin.addComponent('render', { type: 'box', material: cabinMat });
    cabin.setLocalScale(0.45, 0.2, 0.35);
    cabin.setPosition(0.05, 0.4, 0);
    car.addChild(cabin);

    // Windows
    const windowMat = this.createMaterial(new pc.Color(0.7, 0.85, 1), 0.15);
    const window = new pc.Entity('Window');
    window.addComponent('render', { type: 'box', material: windowMat });
    window.setLocalScale(0.4, 0.12, 0.02);
    window.setPosition(0.05, 0.42, 0.17);
    car.addChild(window);

    // Wheels
    const wheelMat = this.createMaterial(new pc.Color(0.15, 0.15, 0.15));
    const wheelPositions = [
      { x: 0.25, z: 0.22 },
      { x: 0.25, z: -0.22 },
      { x: -0.25, z: 0.22 },
      { x: -0.25, z: -0.22 },
    ];
    wheelPositions.forEach((pos, i) => {
      const wheel = new pc.Entity(`Wheel_${i}`);
      wheel.addComponent('render', { type: 'cylinder', material: wheelMat });
      wheel.setLocalScale(0.15, 0.06, 0.15);
      wheel.setPosition(pos.x, 0.08, pos.z);
      wheel.setEulerAngles(90, 0, 0);
      car.addChild(wheel);
    });

    // Headlights
    const lightMat = this.createMaterial(new pc.Color(1, 1, 0.8), 0.5);
    [-0.12, 0.12].forEach((z, i) => {
      const light = new pc.Entity(`Light_${i}`);
      light.addComponent('render', { type: 'sphere', material: lightMat });
      light.setLocalScale(0.08, 0.06, 0.06);
      light.setPosition(0.4, 0.2, z);
      car.addChild(light);
    });

    return car;
  }

  private createBall(): pc.Entity {
    const ball = new pc.Entity('Ball');
    
    // Main sphere with stripes
    const mat1 = this.createMaterial(new pc.Color(0.9, 0.2, 0.3));
    const mat2 = this.createMaterial(new pc.Color(0.2, 0.3, 0.9));
    const mat3 = this.createMaterial(new pc.Color(1, 1, 1));

    const main = new pc.Entity('Main');
    main.addComponent('render', { type: 'sphere', material: mat1 });
    ball.addChild(main);

    // Stripe
    const stripe = new pc.Entity('Stripe');
    stripe.addComponent('render', { type: 'torus', material: mat3 });
    stripe.setLocalScale(0.52, 0.52, 0.1);
    stripe.setEulerAngles(90, 0, 0);
    ball.addChild(stripe);

    // Another stripe
    const stripe2 = new pc.Entity('Stripe2');
    stripe2.addComponent('render', { type: 'torus', material: mat2 });
    stripe2.setLocalScale(0.52, 0.52, 0.1);
    stripe2.setEulerAngles(0, 0, 0);
    ball.addChild(stripe2);

    return ball;
  }

  private createBook(): pc.Entity {
    const book = new pc.Entity('Book');
    
    // Cover
    const coverMat = this.createMaterial(new pc.Color(0.15, 0.35, 0.7));
    const cover = new pc.Entity('Cover');
    cover.addComponent('render', { type: 'box', material: coverMat });
    cover.setLocalScale(0.6, 0.8, 0.15);
    book.addChild(cover);

    // Pages
    const pageMat = this.createMaterial(new pc.Color(1, 0.98, 0.9));
    const pages = new pc.Entity('Pages');
    pages.addComponent('render', { type: 'box', material: pageMat });
    pages.setLocalScale(0.55, 0.75, 0.12);
    pages.setPosition(0.02, 0, 0);
    book.addChild(pages);

    // Spine
    const spineMat = this.createMaterial(new pc.Color(0.1, 0.25, 0.55));
    const spine = new pc.Entity('Spine');
    spine.addComponent('render', { type: 'box', material: spineMat });
    spine.setLocalScale(0.05, 0.8, 0.15);
    spine.setPosition(-0.3, 0, 0);
    book.addChild(spine);

    // Title decoration
    const titleMat = this.createMaterial(new pc.Color(1, 0.85, 0.2));
    const title = new pc.Entity('Title');
    title.addComponent('render', { type: 'box', material: titleMat });
    title.setLocalScale(0.35, 0.08, 0.02);
    title.setPosition(0.05, 0.15, 0.08);
    book.addChild(title);

    book.setEulerAngles(-10, 15, 5);
    return book;
  }

  // =============================================
  // NATURE
  // =============================================

  private createSun(): pc.Entity {
    const sun = new pc.Entity('Sun');
    const mat = this.createMaterial(new pc.Color(1, 0.85, 0.1), 0.4, 0.1);

    // Core
    const core = new pc.Entity('Core');
    core.addComponent('render', { type: 'sphere', material: mat });
    core.setLocalScale(0.6, 0.6, 0.6);
    sun.addChild(core);

    // Rays
    for (let i = 0; i < 8; i++) {
      const ray = new pc.Entity(`Ray_${i}`);
      ray.addComponent('render', { type: 'cone', material: mat });
      ray.setLocalScale(0.12, 0.35, 0.08);
      
      const angle = (i / 8) * Math.PI * 2;
      ray.setPosition(Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0);
      ray.setEulerAngles(0, 0, (angle * 180 / Math.PI) - 90);
      sun.addChild(ray);
    }

    // Glow
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = new pc.Color(1, 0.9, 0.3);
    glowMat.emissive = new pc.Color(0.5, 0.4, 0.1);
    glowMat.opacity = 0.3;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();
    const glow = new pc.Entity('Glow');
    glow.addComponent('render', { type: 'sphere', material: glowMat });
    glow.setLocalScale(1.2, 1.2, 0.5);
    sun.addChild(glow);

    return sun;
  }

  private createMoon(): pc.Entity {
    const moon = new pc.Entity('Moon');
    const mat = this.createMaterial(new pc.Color(0.95, 0.95, 0.85), 0.15);

    // Main body
    const body = new pc.Entity('Body');
    body.addComponent('render', { type: 'sphere', material: mat });
    moon.addChild(body);

    // Craters
    const craterMat = this.createMaterial(new pc.Color(0.8, 0.8, 0.75));
    const craterPositions = [
      { x: 0.2, y: 0.25, z: 0.35, s: 0.15 },
      { x: -0.15, y: -0.1, z: 0.4, s: 0.12 },
      { x: 0.3, y: -0.2, z: 0.3, s: 0.1 },
      { x: -0.25, y: 0.2, z: 0.32, s: 0.08 },
    ];
    craterPositions.forEach((pos, i) => {
      const crater = new pc.Entity(`Crater_${i}`);
      crater.addComponent('render', { type: 'sphere', material: craterMat });
      crater.setLocalScale(pos.s, pos.s * 0.3, pos.s);
      crater.setPosition(pos.x, pos.y, pos.z);
      moon.addChild(crater);
    });

    // Glow
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = new pc.Color(0.9, 0.9, 1);
    glowMat.emissive = new pc.Color(0.1, 0.1, 0.15);
    glowMat.opacity = 0.2;
    glowMat.blendType = pc.BLEND_ADDITIVE;
    glowMat.update();
    const glow = new pc.Entity('Glow');
    glow.addComponent('render', { type: 'sphere', material: glowMat });
    glow.setLocalScale(1.15, 1.15, 1.15);
    moon.addChild(glow);

    return moon;
  }

  private createFlower(): pc.Entity {
    const flower = new pc.Entity('Flower');
    
    // Stem
    const stemMat = this.createMaterial(new pc.Color(0.2, 0.6, 0.2));
    const stem = new pc.Entity('Stem');
    stem.addComponent('render', { type: 'cylinder', material: stemMat });
    stem.setLocalScale(0.06, 0.5, 0.06);
    stem.setPosition(0, -0.1, 0);
    flower.addChild(stem);

    // Leaf
    const leaf = new pc.Entity('Leaf');
    leaf.addComponent('render', { type: 'sphere', material: stemMat });
    leaf.setLocalScale(0.15, 0.05, 0.08);
    leaf.setPosition(0.1, -0.15, 0);
    leaf.setEulerAngles(0, 0, -30);
    flower.addChild(leaf);

    // Petals
    const petalMat = this.createMaterial(new pc.Color(1, 0.4, 0.5), 0.15);
    for (let i = 0; i < 6; i++) {
      const petal = new pc.Entity(`Petal_${i}`);
      petal.addComponent('render', { type: 'sphere', material: petalMat });
      petal.setLocalScale(0.2, 0.08, 0.15);
      
      const angle = (i / 6) * Math.PI * 2;
      petal.setPosition(Math.cos(angle) * 0.18, 0.35, Math.sin(angle) * 0.18);
      petal.setEulerAngles(0, angle * 180 / Math.PI, 20);
      flower.addChild(petal);
    }

    // Center
    const centerMat = this.createMaterial(new pc.Color(1, 0.85, 0.2));
    const center = new pc.Entity('Center');
    center.addComponent('render', { type: 'sphere', material: centerMat });
    center.setLocalScale(0.18, 0.15, 0.18);
    center.setPosition(0, 0.35, 0);
    flower.addChild(center);

    return flower;
  }

  private createTreeModel(): pc.Entity {
    const tree = new pc.Entity('TreeWord');
    
    // Trunk
    const trunkMat = this.createMaterial(new pc.Color(0.5, 0.35, 0.2));
    const trunk = new pc.Entity('Trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.15, 0.5, 0.15);
    trunk.setPosition(0, 0, 0);
    tree.addChild(trunk);

    // Foliage layers
    const foliageMat = this.createMaterial(new pc.Color(0.2, 0.7, 0.3));
    const layers = [
      { y: 0.4, scale: 0.5 },
      { y: 0.6, scale: 0.4 },
      { y: 0.75, scale: 0.25 },
    ];
    layers.forEach((layer, i) => {
      const foliage = new pc.Entity(`Foliage_${i}`);
      foliage.addComponent('render', { type: 'sphere', material: foliageMat });
      foliage.setLocalScale(layer.scale, layer.scale * 0.8, layer.scale);
      foliage.setPosition(0, layer.y, 0);
      tree.addChild(foliage);
    });

    return tree;
  }
}

export default WordModelGenerator;
