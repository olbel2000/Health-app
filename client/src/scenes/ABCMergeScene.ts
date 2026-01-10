/**
 * ABC Merge Scene - Module C
 * Merge animals from A-Z (Ant → Bee → Cat → ... → Zebra)
 * Drop animals, same animals merge into next level!
 */

import * as pc from 'playcanvas';
import { Scene } from '../core/SceneManager';

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

    // Container dimensions
    private containerWidth = 6;
    private containerHeight = 8;
    private containerDepth = 2;
    private dropHeight = 4;
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
            clearColor: new pc.Color(0.1, 0.15, 0.25),
            fov: 45,
        });
        this.camera.setPosition(0, 2, 12);
        this.camera.lookAt(new pc.Vec3(0, 0, 0));
        this.root.addChild(this.camera);
    }

    private setupLighting(): void {
        const light = new pc.Entity('light');
        light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1, 0.95, 0.9),
            intensity: 1.2,
        });
        light.setEulerAngles(45, 45, 0);
        this.root.addChild(light);

        const ambient = new pc.Entity('ambient');
        ambient.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.4, 0.5, 0.7),
            intensity: 0.5,
        });
        ambient.setEulerAngles(-30, -45, 0);
        this.root.addChild(ambient);
    }

    private createContainer(): void {
        this.container = new pc.Entity('container');

        const wallMat = new pc.StandardMaterial();
        wallMat.diffuse = new pc.Color(0.2, 0.3, 0.5);
        wallMat.opacity = 0.3;
        wallMat.blendType = pc.BLEND_NORMAL;
        wallMat.update();

        // Left wall
        const leftWall = new pc.Entity('left-wall');
        leftWall.addComponent('render', { type: 'box', material: wallMat });
        leftWall.setLocalScale(0.2, this.containerHeight, this.containerDepth);
        leftWall.setPosition(-this.containerWidth / 2 - 0.1, 0, 0);
        this.container.addChild(leftWall);

        // Right wall
        const rightWall = new pc.Entity('right-wall');
        rightWall.addComponent('render', { type: 'box', material: wallMat });
        rightWall.setLocalScale(0.2, this.containerHeight, this.containerDepth);
        rightWall.setPosition(this.containerWidth / 2 + 0.1, 0, 0);
        this.container.addChild(rightWall);

        // Bottom
        const bottomMat = new pc.StandardMaterial();
        bottomMat.diffuse = new pc.Color(0.3, 0.4, 0.5);
        bottomMat.update();

        const bottom = new pc.Entity('bottom');
        bottom.addComponent('render', { type: 'box', material: bottomMat });
        bottom.setLocalScale(this.containerWidth + 0.4, 0.3, this.containerDepth);
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
            this.currentAnimal.setPosition(this.dropX, this.dropHeight, 0);
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
        this.updateUI();
    }

    private createAnimalEntity(level: number): pc.Entity {
        const animal = ANIMALS[level];
        const radius = BASE_RADIUS * Math.pow(SIZE_MULTIPLIER, level);

        const entity = new pc.Entity(`animal-${animal.name}`);

        const mat = new pc.StandardMaterial();
        mat.diffuse = animal.color;
        mat.gloss = 0.7;
        mat.metalness = 0.1;
        mat.useMetalness = true;
        mat.update();

        entity.addComponent('render', { type: 'sphere', material: mat });
        entity.setLocalScale(radius * 2, radius * 2, radius * 2);

        return entity;
    }

    private dropAnimal(): void {
        if (!this.currentAnimal) return;

        this.canDrop = false;

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
