/**
 * ABC Merge Scene - Module C
 * Merge animals from A-Z (Ant → Bee → Cat → ... → Zebra)
 * Drop animals, same animals merge into next level!
 */

import * as pc from 'playcanvas';
import { Scene } from '../core/SceneManager';
import { soundManager } from '../services/SoundManager';
import { AssetLoader } from '../services/AssetLoader';

// Animal definitions A-Z
const ANIMALS = [
    { name: 'Ant', emoji: '🐜', color: new pc.Color(0.4, 0.25, 0.1) },
    { name: 'Bee', emoji: '🐝', color: new pc.Color(1, 0.8, 0) },
    { name: 'Cat', emoji: '🐱', color: new pc.Color(1, 0.6, 0.2) },
    { name: 'Dog', emoji: '🐕', color: new pc.Color(0.6, 0.4, 0.2) },
    { name: 'Elephant', emoji: '🐘', color: new pc.Color(0.5, 0.5, 0.55) },
    { name: 'Fish', emoji: '🐟', color: new pc.Color(0.2, 0.6, 1) },
    { name: 'Giraffe', emoji: '🦒', color: new pc.Color(0.9, 0.7, 0.3) },
    { name: 'Horse', emoji: '🐴', color: new pc.Color(0.5, 0.3, 0.15) },
    { name: 'Iguana', emoji: '🦎', color: new pc.Color(0.3, 0.7, 0.3) },
    { name: 'Jellyfish', emoji: '🪼', color: new pc.Color(0.8, 0.5, 0.9) },
    { name: 'Koala', emoji: '🐨', color: new pc.Color(0.6, 0.6, 0.6) },
    { name: 'Lion', emoji: '🦁', color: new pc.Color(0.9, 0.6, 0.2) },
    { name: 'Mouse', emoji: '🐭', color: new pc.Color(0.7, 0.7, 0.7) },
    { name: 'Newt', emoji: '🦎', color: new pc.Color(0.8, 0.4, 0.2) },
    { name: 'Owl', emoji: '🦉', color: new pc.Color(0.5, 0.35, 0.2) },
    { name: 'Penguin', emoji: '🐧', color: new pc.Color(0.2, 0.2, 0.2) },
    { name: 'Quail', emoji: '🐦', color: new pc.Color(0.6, 0.5, 0.4) },
    { name: 'Rabbit', emoji: '🐰', color: new pc.Color(0.9, 0.85, 0.8) },
    { name: 'Snake', emoji: '🐍', color: new pc.Color(0.3, 0.6, 0.2) },
    { name: 'Tiger', emoji: '🐯', color: new pc.Color(1, 0.5, 0) },
    { name: 'Unicorn', emoji: '🦄', color: new pc.Color(0.9, 0.7, 0.9) },
    { name: 'Vulture', emoji: '🦅', color: new pc.Color(0.3, 0.25, 0.2) },
    { name: 'Whale', emoji: '🐋', color: new pc.Color(0.2, 0.4, 0.6) },
    { name: 'X-ray fish', emoji: '🐠', color: new pc.Color(0.7, 0.8, 0.9) },
    { name: 'Yak', emoji: '🐃', color: new pc.Color(0.4, 0.3, 0.25) },
    { name: 'Zebra', emoji: '🦓', color: new pc.Color(0.9, 0.9, 0.9) },
];

// Size multiplier per level
const BASE_RADIUS = 0.35;
const SIZE_MULTIPLIER = 1.12;

interface DroppedAnimal {
    entity: pc.Entity;
    level: number;
    radius: number;
    velocity: pc.Vec3;
    isDropping: boolean;
}

export class ABCMergeScene extends Scene {
    private camera: pc.Entity | null = null;
    private container: pc.Entity | null = null;
    private animals: DroppedAnimal[] = [];
    private currentAnimal: pc.Entity | null = null;
    private currentLevel = 0;
    private nextLevel = 0;
    private dropX = 0;
    private score = 0;
    private bestLevel = 0;
    private isPlaying = false;
    private canDrop = true;
    private graceTimer = 0;

    private guideLine: pc.Entity | null = null;
    private dropHeight = 3.2; // Lowered from 4 to fix top UI overlap (3.2 works well)

    // Container dimensions
    private containerWidth = 6;
    private containerHeight = 8;
    private containerDepth = 2;

    private dangerLineY = 3;

    // Physics
    private gravity = -15;
    private friction = 0.85;
    private bounceEnergy = 0.3;

    constructor() {
        super('abc-merge');
    }

    async onEnter(): Promise<void> {
        this.setupCamera();
        this.setupLighting();
        this.createContainer();
        this.setupControls();
    }

    private setupCamera(): void {
        this.camera = new pc.Entity('camera');
        this.camera.addComponent('camera', {
            clearColor: new pc.Color(0.12, 0.1, 0.25), // Deep purple/blue night sky
            fov: 45,
        });
        this.camera.setPosition(0, 2, 12);
        this.camera.lookAt(new pc.Vec3(0, 0, 0));
        this.root.addChild(this.camera);

        // Add ambient particles
        this.createAmbientParticles();
    }

    private setupLighting(): void {
        // Main Warm Sun
        const light = new pc.Entity('light');
        light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1, 0.9, 0.8), // Warm golden
            intensity: 1.4,
            castShadows: true,
        });
        light.setEulerAngles(45, 30, 0);
        this.root.addChild(light);

        // Cool Fill Light
        const fillLight = new pc.Entity('fill-light');
        fillLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.3, 0.3, 0.5), // Cool blue/purple
            intensity: 0.6,
        });
        fillLight.setEulerAngles(-30, -30, 0);
        this.root.addChild(fillLight);

        // Rim Light (Backlight for glossy effect)
        const rimLight = new pc.Entity('rim-light');
        rimLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.4, 0.6, 1.0), // Blue-ish rim
            intensity: 0.8,
        });
        rimLight.setEulerAngles(180, 0, 0); // From behind
        this.root.addChild(rimLight);
    }

    private async createAmbientParticles(): Promise<void> {
        // Create floaty particles in background
        const particleMat = new pc.StandardMaterial();
        particleMat.emissive = new pc.Color(0.5, 0.7, 1);
        particleMat.opacity = 0.6;
        particleMat.blendType = pc.BLEND_ADDITIVE;
        particleMat.update();

        // Load Leaf Texture
        const assetLoader = AssetLoader.getInstance();
        try {
            await assetLoader.loadTexture('/textures/leaf.png', 'leaf-texture');
            // If loaded, we use a different material setup
            console.log("Leaf texture loaded");
        } catch (e) {
            console.warn("Leaf texture failed to load", e);
        }

        for (let i = 0; i < 40; i++) {
            const p = new pc.Entity(`particle_${i}`);

            // Use simple colored planes/boxes for "leaves" or "spores"
            // If we had the texture, we would use a plane with opacity map
            // For now, let's keep the colored boxes but try to apply the texture if available to a subset?
            // Actually, let's just create a shared material for the textured ones

            p.addComponent('render', { type: 'plane', material: particleMat }); // changed to plane for leaf look

            const scale = 0.05 + Math.random() * 0.15;
            p.setLocalScale(scale, scale, scale); // Leaf shapeish

            // Tropical colors (Green, Pink, Gold)
            const colors = [
                new pc.Color(0.2, 0.8, 0.4), // Green
                new pc.Color(1, 0.4, 0.7),   // Pink
                new pc.Color(1, 0.8, 0.2)    // Gold
            ];
            const pMat = new pc.StandardMaterial();
            const color = colors[Math.floor(Math.random() * colors.length)];
            pMat.emissive = color;
            pMat.diffuse = color;
            pMat.opacity = 1; // Alpha test?
            pMat.blendType = pc.BLEND_NORMAL;

            // Try to apply texture if we can get it reference (async issue in loop)
            // Ideally we load texture once outside.
            const app = pc.Application.getApplication();
            const texAsset = app?.assets.find('leaf-texture');
            if (texAsset && texAsset.resource) {
                pMat.diffuseMap = texAsset.resource as pc.Texture;
                pMat.emissiveMap = texAsset.resource as pc.Texture;
                pMat.opacityMap = texAsset.resource as pc.Texture; // Use same for shape
                pMat.alphaTest = 0.5; // Cutout
                pMat.useLighting = false;
                pMat.emissiveIntensity = 0.5;
            } else {
                pMat.blendType = pc.BLEND_ADDITIVE;
                pMat.opacity = 0.6;
            }

            pMat.update();

            p.render!.material = pMat; // Assign unique material

            // Random position in background
            const x = (Math.random() - 0.5) * 25;
            const y = (Math.random() - 0.5) * 20;
            const z = -2 - Math.random() * 8;
            p.setPosition(x, y, z);

            // Random rotation
            p.setEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);

            this.root.addChild(p);
        }
    }

    private createContainer(): void {
        this.container = new pc.Entity('container');

        // BAMBOO Material
        const bambooMat = new pc.StandardMaterial();
        bambooMat.diffuse = new pc.Color(0.4, 0.6, 0.2); // Fallback Green
        bambooMat.gloss = 0.4;
        bambooMat.metalness = 0.1;
        bambooMat.useMetalness = true;
        bambooMat.update();

        // WATER Material
        const waterMat = new pc.StandardMaterial();
        waterMat.diffuse = new pc.Color(0.2, 0.6, 0.8);
        waterMat.opacity = 0.75; // Less transparent to see texture
        waterMat.blendType = pc.BLEND_NORMAL;
        waterMat.gloss = 0.95;
        waterMat.metalness = 0.6;
        waterMat.useMetalness = true;
        waterMat.emissive = new pc.Color(0.1, 0.3, 0.4);
        waterMat.update();

        // Load Textures Async
        const assetLoader = AssetLoader.getInstance();

        // Bamboo Texture
        assetLoader.loadTexture('/textures/bamboo.png', 'bamboo-texture').then((texture: pc.Texture) => {
            bambooMat.diffuseMap = texture;
            bambooMat.diffuse = new pc.Color(1, 1, 1); // White to show texture colors

            // Tiling for bamboo (vertical repeat)
            bambooMat.diffuseMapTiling = new pc.Vec2(3, 8);
            bambooMat.update();
        }).catch((err: any) => console.error("Bamboo texture load error", err));

        // Water Texture
        assetLoader.loadTexture('/textures/water.png', 'water-texture').then((texture: pc.Texture) => {
            waterMat.diffuseMap = texture;
            // waterMat.opacityMap = texture; // Maybe?
            waterMat.diffuse = new pc.Color(0.5, 0.8, 1); // Tint

            // Tiling for water
            waterMat.diffuseMapTiling = new pc.Vec2(4, 2);
            waterMat.update();
        }).catch((err: any) => console.error("Water texture load error", err));

        // Left Bamboo
        const leftWall = new pc.Entity('left-bamboo');
        leftWall.addComponent('render', { type: 'cylinder', material: bambooMat });
        leftWall.setLocalScale(0.3, this.containerHeight, 0.3); // Cylinder
        leftWall.setPosition(-this.containerWidth / 2 - 0.1, 0, 0);
        this.container.addChild(leftWall);

        // Right Bamboo
        const rightWall = new pc.Entity('right-bamboo');
        rightWall.addComponent('render', { type: 'cylinder', material: bambooMat });
        rightWall.setLocalScale(0.3, this.containerHeight, 0.3);
        rightWall.setPosition(this.containerWidth / 2 + 0.1, 0, 0);
        this.container.addChild(rightWall);

        // Invisible walls for physics (since cylinders are round and might act weird with physics interactions if we used them directly)
        // We keep invisible box colliders effectively by not rendering them or rendering transparently?
        // Ideally we should have separate visual and physics, but here we just rely on visual bounds?
        // Wait, the collision logic in dropAnimal uses manual checking against containerWidth, so visual walls don't need physics components!
        // Perfect.

        // Bottom - Water Bed
        const bottom = new pc.Entity('water-bed');
        bottom.addComponent('render', { type: 'box', material: waterMat });
        bottom.setLocalScale(this.containerWidth + 0.4, 0.5, this.containerDepth); // Thicker water box
        bottom.setPosition(0, -this.containerHeight / 2, 0);
        this.container.addChild(bottom);

        // Danger line
        const dangerMat = new pc.StandardMaterial();
        dangerMat.diffuse = new pc.Color(1, 0.2, 0.2);
        dangerMat.emissive = new pc.Color(0.5, 0, 0);
        dangerMat.opacity = 0.5;
        dangerMat.blendType = pc.BLEND_NORMAL;
        dangerMat.update();

        const dangerLine = new pc.Entity('danger-line');
        dangerLine.addComponent('render', { type: 'box', material: dangerMat });
        dangerLine.setLocalScale(this.containerWidth, 0.05, this.containerDepth);
        dangerLine.setPosition(0, this.dangerLineY, 0);
        this.container.addChild(dangerLine);

        this.container.addChild(dangerLine);

        // Guide Line (Visual aiming aid)
        this.guideLine = new pc.Entity('guide-line');
        // Create a thin vertical line
        this.guideLine.addComponent('render', { type: 'cylinder', material: new pc.StandardMaterial() });
        const guideMat = this.guideLine.render!.meshInstances[0].material as pc.StandardMaterial;
        guideMat.diffuse = new pc.Color(1, 1, 1);
        guideMat.opacity = 0.3; // Semi-transparent
        guideMat.blendType = pc.BLEND_ADDITIVE;
        guideMat.emissive = new pc.Color(0.5, 0.5, 0.5);
        guideMat.update();

        // Scale it to look like a line (thin and tall)
        // Tall enough to reach bottom from top
        const lineHeight = this.containerHeight + 2;
        this.guideLine.setLocalScale(0.02, lineHeight, 0.02);
        // Position it so top is near drop height
        // Cylinder origin is center, so move it down by half height
        this.guideLine.setLocalPosition(0, -lineHeight / 2 + 3.5, 0);

        this.root.addChild(this.guideLine);
        this.guideLine.enabled = false; // Hidden initially

        this.root.addChild(this.container);
    }

    private setupControls(): void {
        const canvas = this.engine.app.graphicsDevice.canvas;

        // Mouse/Touch move
        const onMove = (x: number) => {
            if (!this.isPlaying || !this.currentAnimal) return;
            const rect = canvas.getBoundingClientRect();
            const normalizedX = (x - rect.left) / rect.width;
            const targetX = (normalizedX - 0.5) * this.containerWidth * 0.9;
            this.dropX = Math.max(-this.containerWidth / 2 + 0.5, Math.min(this.containerWidth / 2 - 0.5, targetX));
            this.dropX = Math.max(-this.containerWidth / 2 + 0.5, Math.min(this.containerWidth / 2 - 0.5, targetX));
            this.currentAnimal.setPosition(this.dropX, this.dropHeight, 0);

            // Update guide line position
            if (this.guideLine) {
                this.guideLine.setPosition(this.dropX, this.guideLine.getPosition().y, 0);
            }
        };

        canvas.addEventListener('mousemove', (e) => onMove(e.clientX));
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) onMove(e.touches[0].clientX);
        });

        // Click/Tap to drop
        const onDrop = () => {
            if (!this.isPlaying || !this.canDrop || !this.currentAnimal) return;
            this.dropAnimal();
        };

        canvas.addEventListener('click', onDrop);
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            onDrop();
        });

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;

            if (e.key === 'ArrowLeft') {
                this.dropX = Math.max(-this.containerWidth / 2 + 0.5, this.dropX - 0.3);
                if (this.currentAnimal) this.currentAnimal.setPosition(this.dropX, this.dropHeight, 0);
            } else if (e.key === 'ArrowRight') {
                this.dropX = Math.min(this.containerWidth / 2 - 0.5, this.dropX + 0.3);
                if (this.currentAnimal) this.currentAnimal.setPosition(this.dropX, this.dropHeight, 0);
            } else if (e.key === ' ') {
                e.preventDefault();
                onDrop();
            }
        });
    }

    startGame(): void {
        // Clear existing animals
        this.animals.forEach(a => a.entity.destroy());
        this.animals = [];

        this.score = 0;
        this.bestLevel = 0;
        this.isPlaying = true;
        this.canDrop = true;
        this.graceTimer = 0;
        this.dropX = 0;

        // Generate first animals
        this.nextLevel = this.getRandomLevel();
        this.spawnNextAnimal();

        this.updateUI();
    }

    private getRandomLevel(): number {
        // Mostly spawn low-level animals (0-4)
        const rand = Math.random();
        if (rand < 0.5) return 0;
        if (rand < 0.75) return 1;
        if (rand < 0.9) return 2;
        if (rand < 0.97) return 3;
        return 4;
    }

    private spawnNextAnimal(): void {
        this.currentLevel = this.nextLevel;
        this.nextLevel = this.getRandomLevel();

        this.currentAnimal = this.createAnimalEntity(this.currentLevel);
        this.currentAnimal.setPosition(this.dropX, this.dropHeight, 0);
        this.root.addChild(this.currentAnimal);

        this.canDrop = true;

        // Show guide line
        if (this.guideLine) {
            this.guideLine.enabled = true;
            this.guideLine.setPosition(this.dropX, this.guideLine.getPosition().y, 0);
        }

        this.updateUI();
    }

    private createAnimalEntity(level: number): pc.Entity {
        const animal = ANIMALS[level];
        const radius = BASE_RADIUS * Math.pow(SIZE_MULTIPLIER, level);
        const scale = radius * 2;

        const entity = new pc.Entity(`animal-${animal.name}`);

        // Create material - TOY PLASTIC LOOK
        const mat = new pc.StandardMaterial();
        mat.diffuse = animal.color;
        mat.gloss = 0.92; // High gloss for plastic look
        mat.metalness = 0.3; // Slight metalness for rich specular
        mat.useMetalness = true;
        mat.specular = new pc.Color(1, 1, 1); // Bright white specular highlights
        mat.emissive = new pc.Color(
            animal.color.r * 0.1,
            animal.color.g * 0.1,
            animal.color.b * 0.1
        ); // Slight emissive to pop in shadows
        mat.update();

        // Secondary material
        const mat2 = new pc.StandardMaterial();
        mat2.diffuse = new pc.Color(
            animal.color.r * 0.6,
            animal.color.g * 0.6,
            animal.color.b * 0.6
        );
        mat2.gloss = 0.85;
        mat2.metalness = 0.2;
        mat2.useMetalness = true;
        mat2.update();

        // Eye material
        const eyeMat = new pc.StandardMaterial();
        eyeMat.diffuse = new pc.Color(1, 1, 1);
        eyeMat.gloss = 0.95;
        eyeMat.update();

        const pupilMat = new pc.StandardMaterial();
        pupilMat.diffuse = new pc.Color(0.05, 0.05, 0.05);
        pupilMat.gloss = 0.9;
        pupilMat.update();

        // Build animal based on type
        switch (level) {
            case 0: // Ant
                this.buildAnt(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 1: // Bee
                this.buildBee(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 2: // Cat
                this.buildCat(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 3: // Dog
                this.buildDog(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 4: // Elephant
                this.buildElephant(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 5: // Fish
                this.buildFish(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 6: // Giraffe
                this.buildGiraffe(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 11: // Lion
                this.buildLion(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 15: // Penguin
                this.buildPenguin(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 17: // Rabbit
                this.buildRabbit(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            case 25: // Zebra
                this.buildZebra(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
            default:
                // Generic cute animal for others
                this.buildGenericAnimal(entity, mat, mat2, eyeMat, pupilMat, scale);
                break;
        }

        return entity;
    }

    private buildAnt(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.4, scale * 0.35, scale * 0.4);
        head.setLocalPosition(0, scale * 0.15, scale * 0.25);
        entity.addChild(head);

        // Body segments
        const thorax = new pc.Entity('thorax');
        thorax.addComponent('render', { type: 'sphere', material: mat });
        thorax.setLocalScale(scale * 0.35, scale * 0.3, scale * 0.35);
        thorax.setLocalPosition(0, 0, 0);
        entity.addChild(thorax);

        const abdomen = new pc.Entity('abdomen');
        abdomen.addComponent('render', { type: 'sphere', material: mat });
        abdomen.setLocalScale(scale * 0.5, scale * 0.4, scale * 0.5);
        abdomen.setLocalPosition(0, -scale * 0.1, -scale * 0.3);
        entity.addChild(abdomen);

        // Antennae
        [-0.08, 0.08].forEach((x, i) => {
            const antenna = new pc.Entity(`antenna_${i}`);
            antenna.addComponent('render', { type: 'cylinder', material: mat2 });
            antenna.setLocalScale(scale * 0.03, scale * 0.2, scale * 0.03);
            antenna.setLocalPosition(x * scale, scale * 0.35, scale * 0.3);
            antenna.setEulerAngles(30, 0, x < 0 ? 20 : -20);
            entity.addChild(antenna);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.08, scale * 0.2, scale * 0.4);
    }

    private buildBee(entity: pc.Entity, mat: pc.StandardMaterial, _mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Create black stripe material
        const blackMat = new pc.StandardMaterial();
        blackMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        blackMat.gloss = 0.8;
        blackMat.update();

        // Body (yellow)
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.6, scale * 0.5, scale * 0.8);
        entity.addChild(body);

        // Black stripes
        [-0.1, 0.1].forEach((z, i) => {
            const stripe = new pc.Entity(`stripe_${i}`);
            stripe.addComponent('render', { type: 'cylinder', material: blackMat });
            stripe.setLocalScale(scale * 0.65, scale * 0.08, scale * 0.55);
            stripe.setLocalPosition(0, 0, z * scale);
            stripe.setEulerAngles(90, 0, 0);
            entity.addChild(stripe);
        });

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.35, scale * 0.35, scale * 0.35);
        head.setLocalPosition(0, scale * 0.1, scale * 0.35);
        entity.addChild(head);

        // Wings
        const wingMat = new pc.StandardMaterial();
        wingMat.diffuse = new pc.Color(0.9, 0.95, 1);
        wingMat.opacity = 0.5;
        wingMat.blendType = pc.BLEND_NORMAL;
        wingMat.update();

        [-0.25, 0.25].forEach((x, i) => {
            const wing = new pc.Entity(`wing_${i}`);
            wing.addComponent('render', { type: 'sphere', material: wingMat });
            wing.setLocalScale(scale * 0.15, scale * 0.02, scale * 0.35);
            wing.setLocalPosition(x * scale, scale * 0.25, 0);
            wing.setEulerAngles(0, 0, x < 0 ? 30 : -30);
            entity.addChild(wing);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.1, scale * 0.2, scale * 0.5);
    }

    private buildCat(entity: pc.Entity, mat: pc.StandardMaterial, _mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.7, scale * 0.6, scale * 0.8);
        entity.addChild(body);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.5, scale * 0.45, scale * 0.45);
        head.setLocalPosition(0, scale * 0.35, scale * 0.2);
        entity.addChild(head);

        // Ears (triangular)
        [-0.15, 0.15].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'cone', material: mat });
            ear.setLocalScale(scale * 0.15, scale * 0.2, scale * 0.1);
            ear.setLocalPosition(x * scale, scale * 0.55, scale * 0.15);
            ear.setEulerAngles(0, 0, x < 0 ? 15 : -15);
            entity.addChild(ear);
        });

        // Tail
        const tail = new pc.Entity('tail');
        tail.addComponent('render', { type: 'cylinder', material: mat });
        tail.setLocalScale(scale * 0.08, scale * 0.4, scale * 0.08);
        tail.setLocalPosition(0, scale * 0.2, -scale * 0.45);
        tail.setEulerAngles(-45, 0, 0);
        entity.addChild(tail);

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.12, scale * 0.45, scale * 0.4);
    }

    private buildDog(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.75, scale * 0.6, scale * 0.85);
        entity.addChild(body);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.5, scale * 0.45, scale * 0.5);
        head.setLocalPosition(0, scale * 0.35, scale * 0.25);
        entity.addChild(head);

        // Snout
        const snout = new pc.Entity('snout');
        snout.addComponent('render', { type: 'sphere', material: mat2 });
        snout.setLocalScale(scale * 0.2, scale * 0.15, scale * 0.2);
        snout.setLocalPosition(0, scale * 0.3, scale * 0.45);
        entity.addChild(snout);

        // Nose
        const noseMat = new pc.StandardMaterial();
        noseMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        noseMat.update();
        const nose = new pc.Entity('nose');
        nose.addComponent('render', { type: 'sphere', material: noseMat });
        nose.setLocalScale(scale * 0.08, scale * 0.06, scale * 0.08);
        nose.setLocalPosition(0, scale * 0.32, scale * 0.52);
        entity.addChild(nose);

        // Floppy ears
        [-0.22, 0.22].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'sphere', material: mat2 });
            ear.setLocalScale(scale * 0.15, scale * 0.25, scale * 0.08);
            ear.setLocalPosition(x * scale, scale * 0.3, scale * 0.15);
            entity.addChild(ear);
        });

        // Tail
        const tail = new pc.Entity('tail');
        tail.addComponent('render', { type: 'cylinder', material: mat });
        tail.setLocalScale(scale * 0.1, scale * 0.3, scale * 0.08);
        tail.setLocalPosition(0, scale * 0.25, -scale * 0.45);
        tail.setEulerAngles(-60, 0, 0);
        entity.addChild(tail);

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.1, scale * 0.45, scale * 0.42);
    }

    private buildElephant(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.9, scale * 0.75, scale);
        entity.addChild(body);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.55, scale * 0.5, scale * 0.5);
        head.setLocalPosition(0, scale * 0.4, scale * 0.35);
        entity.addChild(head);

        // Trunk
        const trunk = new pc.Entity('trunk');
        trunk.addComponent('render', { type: 'cylinder', material: mat });
        trunk.setLocalScale(scale * 0.12, scale * 0.4, scale * 0.1);
        trunk.setLocalPosition(0, scale * 0.15, scale * 0.55);
        trunk.setEulerAngles(30, 0, 0);
        entity.addChild(trunk);

        // Big ears
        [-0.35, 0.35].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'sphere', material: mat2 });
            ear.setLocalScale(scale * 0.35, scale * 0.4, scale * 0.08);
            ear.setLocalPosition(x * scale, scale * 0.4, scale * 0.2);
            entity.addChild(ear);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.08, scale * 0.5, scale * 0.5);
    }

    private buildFish(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.5, scale * 0.6, scale);
        entity.addChild(body);

        // Tail fin
        const tail = new pc.Entity('tail');
        tail.addComponent('render', { type: 'cone', material: mat2 });
        tail.setLocalScale(scale * 0.3, scale * 0.4, scale * 0.1);
        tail.setLocalPosition(0, 0, -scale * 0.5);
        tail.setEulerAngles(0, 0, 0);
        entity.addChild(tail);

        // Top fin
        const topFin = new pc.Entity('top-fin');
        topFin.addComponent('render', { type: 'cone', material: mat2 });
        topFin.setLocalScale(scale * 0.08, scale * 0.25, scale * 0.3);
        topFin.setLocalPosition(0, scale * 0.35, 0);
        entity.addChild(topFin);

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.12, scale * 0.1, scale * 0.35);
    }

    private buildGiraffe(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.6, scale * 0.5, scale * 0.7);
        body.setLocalPosition(0, -scale * 0.1, 0);
        entity.addChild(body);

        // Long neck
        const neck = new pc.Entity('neck');
        neck.addComponent('render', { type: 'cylinder', material: mat });
        neck.setLocalScale(scale * 0.15, scale * 0.5, scale * 0.15);
        neck.setLocalPosition(0, scale * 0.35, scale * 0.15);
        neck.setEulerAngles(-15, 0, 0);
        entity.addChild(neck);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.25, scale * 0.2, scale * 0.25);
        head.setLocalPosition(0, scale * 0.6, scale * 0.25);
        entity.addChild(head);

        // Horns (ossicones)
        [-0.06, 0.06].forEach((x, i) => {
            const horn = new pc.Entity(`horn_${i}`);
            horn.addComponent('render', { type: 'cylinder', material: mat2 });
            horn.setLocalScale(scale * 0.04, scale * 0.1, scale * 0.04);
            horn.setLocalPosition(x * scale, scale * 0.72, scale * 0.25);
            entity.addChild(horn);
        });

        // Spots
        const spotMat = new pc.StandardMaterial();
        spotMat.diffuse = new pc.Color(0.5, 0.3, 0.1);
        spotMat.update();
        [{ x: 0.15, y: 0, z: 0.2 }, { x: -0.1, y: -0.1, z: -0.15 }].forEach((pos, i) => {
            const spot = new pc.Entity(`spot_${i}`);
            spot.addComponent('render', { type: 'sphere', material: spotMat });
            spot.setLocalScale(scale * 0.12, scale * 0.08, scale * 0.12);
            spot.setLocalPosition(pos.x * scale, pos.y * scale, pos.z * scale);
            entity.addChild(spot);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.06, scale * 0.62, scale * 0.38);
    }

    private buildLion(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Mane
        const maneMat = new pc.StandardMaterial();
        maneMat.diffuse = new pc.Color(0.6, 0.35, 0.1);
        maneMat.update();
        const mane = new pc.Entity('mane');
        mane.addComponent('render', { type: 'sphere', material: maneMat });
        mane.setLocalScale(scale * 0.8, scale * 0.75, scale * 0.5);
        mane.setLocalPosition(0, scale * 0.25, scale * 0.1);
        entity.addChild(mane);

        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.7, scale * 0.55, scale * 0.8);
        entity.addChild(body);

        // Face
        const face = new pc.Entity('face');
        face.addComponent('render', { type: 'sphere', material: mat });
        face.setLocalScale(scale * 0.45, scale * 0.4, scale * 0.35);
        face.setLocalPosition(0, scale * 0.3, scale * 0.25);
        entity.addChild(face);

        // Snout
        const snout = new pc.Entity('snout');
        snout.addComponent('render', { type: 'sphere', material: mat2 });
        snout.setLocalScale(scale * 0.18, scale * 0.12, scale * 0.15);
        snout.setLocalPosition(0, scale * 0.22, scale * 0.42);
        entity.addChild(snout);

        // Small ears
        [-0.2, 0.2].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'sphere', material: mat });
            ear.setLocalScale(scale * 0.1, scale * 0.1, scale * 0.05);
            ear.setLocalPosition(x * scale, scale * 0.5, scale * 0.1);
            entity.addChild(ear);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.08, scale * 0.38, scale * 0.4);
    }

    private buildPenguin(entity: pc.Entity, mat: pc.StandardMaterial, _mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body (black)
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.6, scale * 0.85, scale * 0.55);
        entity.addChild(body);

        // Belly (white)
        const bellyMat = new pc.StandardMaterial();
        bellyMat.diffuse = new pc.Color(0.95, 0.95, 0.95);
        bellyMat.update();
        const belly = new pc.Entity('belly');
        belly.addComponent('render', { type: 'sphere', material: bellyMat });
        belly.setLocalScale(scale * 0.4, scale * 0.65, scale * 0.35);
        belly.setLocalPosition(0, -scale * 0.05, scale * 0.15);
        entity.addChild(belly);

        // Beak (orange)
        const beakMat = new pc.StandardMaterial();
        beakMat.diffuse = new pc.Color(1, 0.5, 0);
        beakMat.update();
        const beak = new pc.Entity('beak');
        beak.addComponent('render', { type: 'cone', material: beakMat });
        beak.setLocalScale(scale * 0.1, scale * 0.12, scale * 0.08);
        beak.setLocalPosition(0, scale * 0.2, scale * 0.3);
        beak.setEulerAngles(90, 0, 0);
        entity.addChild(beak);

        // Feet
        [-0.12, 0.12].forEach((x, i) => {
            const foot = new pc.Entity(`foot_${i}`);
            foot.addComponent('render', { type: 'box', material: beakMat });
            foot.setLocalScale(scale * 0.15, scale * 0.03, scale * 0.12);
            foot.setLocalPosition(x * scale, -scale * 0.42, scale * 0.08);
            entity.addChild(foot);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.08, scale * 0.28, scale * 0.28);
    }

    private buildRabbit(entity: pc.Entity, mat: pc.StandardMaterial, _mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.6, scale * 0.55, scale * 0.7);
        entity.addChild(body);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.45, scale * 0.4, scale * 0.4);
        head.setLocalPosition(0, scale * 0.35, scale * 0.2);
        entity.addChild(head);

        // Long ears
        [-0.1, 0.1].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'capsule', material: mat });
            ear.setLocalScale(scale * 0.08, scale * 0.35, scale * 0.05);
            ear.setLocalPosition(x * scale, scale * 0.65, scale * 0.1);
            ear.setEulerAngles(0, 0, x < 0 ? 10 : -10);
            entity.addChild(ear);
        });

        // Tail (fluffy ball)
        const tail = new pc.Entity('tail');
        tail.addComponent('render', { type: 'sphere', material: mat });
        tail.setLocalScale(scale * 0.15, scale * 0.15, scale * 0.15);
        tail.setLocalPosition(0, 0, -scale * 0.35);
        entity.addChild(tail);

        // Pink inner ear
        const pinkMat = new pc.StandardMaterial();
        pinkMat.diffuse = new pc.Color(1, 0.7, 0.75);
        pinkMat.update();
        [-0.08, 0.08].forEach((x, i) => {
            const innerEar = new pc.Entity(`inner_ear_${i}`);
            innerEar.addComponent('render', { type: 'capsule', material: pinkMat });
            innerEar.setLocalScale(scale * 0.04, scale * 0.25, scale * 0.02);
            innerEar.setLocalPosition(x * scale, scale * 0.62, scale * 0.12);
            innerEar.setEulerAngles(0, 0, x < 0 ? 10 : -10);
            entity.addChild(innerEar);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.1, scale * 0.42, scale * 0.38);
    }

    private buildZebra(entity: pc.Entity, mat: pc.StandardMaterial, _mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Body (white)
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.7, scale * 0.55, scale * 0.85);
        entity.addChild(body);

        // Black stripes
        const stripeMat = new pc.StandardMaterial();
        stripeMat.diffuse = new pc.Color(0.1, 0.1, 0.1);
        stripeMat.update();
        [-0.2, 0, 0.2].forEach((z, i) => {
            const stripe = new pc.Entity(`stripe_${i}`);
            stripe.addComponent('render', { type: 'box', material: stripeMat });
            stripe.setLocalScale(scale * 0.72, scale * 0.56, scale * 0.05);
            stripe.setLocalPosition(0, 0, z * scale);
            entity.addChild(stripe);
        });

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.35, scale * 0.35, scale * 0.45);
        head.setLocalPosition(0, scale * 0.35, scale * 0.35);
        entity.addChild(head);

        // Snout
        const snout = new pc.Entity('snout');
        snout.addComponent('render', { type: 'sphere', material: mat });
        snout.setLocalScale(scale * 0.18, scale * 0.15, scale * 0.2);
        snout.setLocalPosition(0, scale * 0.28, scale * 0.52);
        entity.addChild(snout);

        // Mane (standing up)
        const mane = new pc.Entity('mane');
        mane.addComponent('render', { type: 'box', material: stripeMat });
        mane.setLocalScale(scale * 0.05, scale * 0.2, scale * 0.4);
        mane.setLocalPosition(0, scale * 0.55, scale * 0.2);
        entity.addChild(mane);

        // Ears
        [-0.12, 0.12].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'cone', material: mat });
            ear.setLocalScale(scale * 0.08, scale * 0.12, scale * 0.05);
            ear.setLocalPosition(x * scale, scale * 0.52, scale * 0.3);
            entity.addChild(ear);
        });

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.07, scale * 0.4, scale * 0.48);
    }

    private buildGenericAnimal(entity: pc.Entity, mat: pc.StandardMaterial, mat2: pc.StandardMaterial, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, scale: number): void {
        // Rounded body
        const body = new pc.Entity('body');
        body.addComponent('render', { type: 'sphere', material: mat });
        body.setLocalScale(scale * 0.7, scale * 0.6, scale * 0.75);
        entity.addChild(body);

        // Head
        const head = new pc.Entity('head');
        head.addComponent('render', { type: 'sphere', material: mat });
        head.setLocalScale(scale * 0.45, scale * 0.4, scale * 0.4);
        head.setLocalPosition(0, scale * 0.35, scale * 0.2);
        entity.addChild(head);

        // Ears
        [-0.15, 0.15].forEach((x, i) => {
            const ear = new pc.Entity(`ear_${i}`);
            ear.addComponent('render', { type: 'sphere', material: mat2 });
            ear.setLocalScale(scale * 0.12, scale * 0.12, scale * 0.06);
            ear.setLocalPosition(x * scale, scale * 0.52, scale * 0.15);
            entity.addChild(ear);
        });

        // Snout
        const snout = new pc.Entity('snout');
        snout.addComponent('render', { type: 'sphere', material: mat2 });
        snout.setLocalScale(scale * 0.15, scale * 0.1, scale * 0.12);
        snout.setLocalPosition(0, scale * 0.28, scale * 0.38);
        entity.addChild(snout);

        // Eyes
        this.addEyes(entity, eyeMat, pupilMat, scale * 0.1, scale * 0.42, scale * 0.35);
    }

    private addEyes(entity: pc.Entity, eyeMat: pc.StandardMaterial, pupilMat: pc.StandardMaterial, size: number, yPos: number, zPos: number): void {
        [-0.12, 0.12].forEach((x, i) => {
            const eye = new pc.Entity(`eye_${i}`);
            eye.addComponent('render', { type: 'sphere', material: eyeMat });
            eye.setLocalScale(size, size, size * 0.5);
            eye.setLocalPosition(x * size * 8, yPos, zPos);
            entity.addChild(eye);

            const pupil = new pc.Entity(`pupil_${i}`);
            pupil.addComponent('render', { type: 'sphere', material: pupilMat });
            pupil.setLocalScale(size * 0.5, size * 0.5, size * 0.3);
            pupil.setLocalPosition(x * size * 8, yPos, zPos + size * 0.3);
            entity.addChild(pupil);
        });
    }

    private dropAnimal(): void {
        if (!this.currentAnimal) return;

        this.canDrop = false;

        // Hide guide line on drop
        if (this.guideLine) {
            this.guideLine.enabled = false;
        }

        soundManager.play('drop');

        const radius = BASE_RADIUS * Math.pow(SIZE_MULTIPLIER, this.currentLevel);

        const dropped: DroppedAnimal = {
            entity: this.currentAnimal,
            level: this.currentLevel,
            radius: radius,
            velocity: new pc.Vec3(0, 0, 0),
            isDropping: true,
        };

        this.animals.push(dropped);
        this.currentAnimal = null;
        this.graceTimer = 2; // 2 seconds before game over check

        // Spawn next after delay
        setTimeout(() => {
            if (this.isPlaying) {
                this.spawnNextAnimal();
            }
        }, 300);
    }

    onUpdate(dt: number): void {
        if (!this.isPlaying) return;

        // Update grace timer
        if (this.graceTimer > 0) {
            this.graceTimer -= dt;
        }

        // Physics update
        this.updatePhysics(dt);

        // Check merges
        this.checkMerges();

        // Check game over
        if (this.graceTimer <= 0) {
            this.checkGameOver();
        }
    }

    private updatePhysics(dt: number): void {
        const bottomY = -this.containerHeight / 2 + 0.15;
        const leftX = -this.containerWidth / 2;
        const rightX = this.containerWidth / 2;

        for (const animal of this.animals) {
            const pos = animal.entity.getPosition();

            // Apply gravity
            animal.velocity.y += this.gravity * dt;

            // Update position
            pos.x += animal.velocity.x * dt;
            pos.y += animal.velocity.y * dt;

            // Wall collisions
            if (pos.x - animal.radius < leftX) {
                pos.x = leftX + animal.radius;
                animal.velocity.x = Math.abs(animal.velocity.x) * this.bounceEnergy;
            }
            if (pos.x + animal.radius > rightX) {
                pos.x = rightX - animal.radius;
                animal.velocity.x = -Math.abs(animal.velocity.x) * this.bounceEnergy;
            }

            // Floor collision
            if (pos.y - animal.radius < bottomY) {
                pos.y = bottomY + animal.radius;
                animal.velocity.y = Math.abs(animal.velocity.y) * this.bounceEnergy;
                animal.velocity.x *= this.friction;
                animal.isDropping = false;
            }

            // Animal-animal collisions (simplified)
            for (const other of this.animals) {
                if (other === animal) continue;

                const otherPos = other.entity.getPosition();
                const dx = pos.x - otherPos.x;
                const dy = pos.y - otherPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = (animal.radius + other.radius) * 0.6; // Tighter packing

                if (dist < minDist && dist > 0.01) {
                    // Push apart
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    pos.x += nx * overlap * 0.5;
                    pos.y += ny * overlap * 0.5;

                    // Bounce
                    const relVelX = animal.velocity.x - other.velocity.x;
                    const relVelY = animal.velocity.y - other.velocity.y;
                    const relVelDotN = relVelX * nx + relVelY * ny;

                    if (relVelDotN < 0) {
                        animal.velocity.x -= relVelDotN * nx * 0.5;
                        animal.velocity.y -= relVelDotN * ny * 0.5;
                        other.velocity.x += relVelDotN * nx * 0.5;
                        other.velocity.y += relVelDotN * ny * 0.5;
                    }
                }
            }

            animal.entity.setPosition(pos);
        }
    }

    private checkMerges(): void {
        for (let i = 0; i < this.animals.length; i++) {
            for (let j = i + 1; j < this.animals.length; j++) {
                const a = this.animals[i];
                const b = this.animals[j];

                // Same level?
                if (a.level !== b.level) continue;

                // Max level (Zebra)?
                if (a.level >= ANIMALS.length - 1) continue;

                const posA = a.entity.getPosition();
                const posB = b.entity.getPosition();
                const dx = posA.x - posB.x;
                const dy = posA.y - posB.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const mergeDistance = (a.radius + b.radius) * 1.1;

                if (dist < mergeDistance) {
                    this.mergeAnimals(i, j);
                    return; // One merge per frame
                }
            }
        }
    }

    private mergeAnimals(indexA: number, indexB: number): void {
        const a = this.animals[indexA];
        const b = this.animals[indexB];
        const newLevel = a.level + 1;

        // Position at midpoint
        const posA = a.entity.getPosition();
        const posB = b.entity.getPosition();
        const midX = (posA.x + posB.x) / 2;
        const midY = (posA.y + posB.y) / 2;

        // Remove old
        a.entity.destroy();
        b.entity.destroy();
        this.animals.splice(Math.max(indexA, indexB), 1);
        this.animals.splice(Math.min(indexA, indexB), 1);

        // Create new
        const newEntity = this.createAnimalEntity(newLevel);
        newEntity.setPosition(midX, midY, 0);
        this.root.addChild(newEntity);

        const newRadius = BASE_RADIUS * Math.pow(SIZE_MULTIPLIER, newLevel);
        const newAnimal: DroppedAnimal = {
            entity: newEntity,
            level: newLevel,
            radius: newRadius,
            velocity: new pc.Vec3(0, 0, 0),
            isDropping: false,
        };
        this.animals.push(newAnimal);

        // Score
        this.score += (newLevel + 1) * 100;
        if (newLevel > this.bestLevel) {
            this.bestLevel = newLevel;
        }

        // Play merge sound (higher pitch for higher levels)
        soundManager.play('merge', newLevel);

        // Show merge notification
        this.showMergeNotification(newLevel);
        this.updateUI();
    }

    private showMergeNotification(level: number): void {
        const animal = ANIMALS[level];
        const notification = document.getElementById('merge-notification');
        if (notification) {
            notification.textContent = `${animal.emoji} ${animal.name}!`;
            notification.style.display = 'block';
            notification.style.opacity = '1';
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            }, 800);
        }
    }

    private checkGameOver(): void {
        for (const animal of this.animals) {
            if (animal.isDropping) continue;

            const pos = animal.entity.getPosition();
            const speed = animal.velocity.length();

            // Only check if animal is settled
            if (speed < 0.5 && pos.y + animal.radius > this.dangerLineY) {
                this.gameOver();
                return;
            }
        }
    }

    private gameOver(): void {
        this.isPlaying = false;
        soundManager.play('gameOver');

        // Show game over
        const gameOver = document.getElementById('game-over');
        const finalScore = document.getElementById('final-score');
        if (gameOver && finalScore) {
            finalScore.textContent = String(this.score);
            gameOver.style.display = 'flex';
        }
    }

    private updateUI(): void {
        const scoreEl = document.getElementById('merge-score');
        const nextEl = document.getElementById('merge-next');
        const bestEl = document.getElementById('merge-best');

        if (scoreEl) scoreEl.textContent = `⭐ ${this.score}`;
        if (nextEl) {
            const next = ANIMALS[this.nextLevel];
            nextEl.textContent = `Next: ${next.emoji}`;
        }
        if (bestEl) {
            const best = ANIMALS[this.bestLevel];
            bestEl.textContent = `🏆 ${best.name}`;
        }
    }

    async onExit(): Promise<void> {
        this.isPlaying = false;
        this.animals.forEach(a => a.entity.destroy());
        this.animals = [];
        if (this.currentAnimal) {
            this.currentAnimal.destroy();
            this.currentAnimal = null;
        }
    }
}

export default ABCMergeScene;
