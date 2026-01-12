/**
 * SoundManager - Procedural sound generation using Web Audio API
 * No external audio files needed!
 */

type SoundType = 'drop' | 'merge' | 'gameOver' | 'click' | 'success';

class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private enabled = true;
    private initialized = false;

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private init(): void {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('[SoundManager] Web Audio API not supported');
            this.enabled = false;
        }
    }

    toggle(): boolean {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    play(type: SoundType, pitch = 1): void {
        if (!this.enabled) return;

        // Initialize on first user interaction
        if (!this.initialized) {
            this.init();
        }

        if (!this.audioContext) return;

        // Resume context if suspended (autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        switch (type) {
            case 'drop':
                this.playDrop();
                break;
            case 'merge':
                this.playMerge(pitch);
                break;
            case 'gameOver':
                this.playGameOver();
                break;
            case 'click':
                this.playClick();
                break;
            case 'success':
                this.playSuccess();
                break;
        }
    }

    private playDrop(): void {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    private playMerge(pitch: number): void {
        if (!this.audioContext) return;

        // Base frequency increases with level
        const baseFreq = 300 + (pitch * 50);

        // Play a pleasant chord
        [1, 1.25, 1.5].forEach((mult, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext!.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq * mult, this.audioContext!.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * mult * 1.5, this.audioContext!.currentTime + 0.2);

            gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime + i * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);

            osc.start(this.audioContext!.currentTime + i * 0.03);
            osc.stop(this.audioContext!.currentTime + 0.3);
        });
    }

    private playGameOver(): void {
        if (!this.audioContext) return;

        // Sad descending notes
        [400, 350, 300, 200].forEach((freq, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext!.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.15);

            gain.gain.setValueAtTime(0.25, this.audioContext!.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + i * 0.15 + 0.2);

            osc.start(this.audioContext!.currentTime + i * 0.15);
            osc.stop(this.audioContext!.currentTime + i * 0.15 + 0.2);
        });
    }

    private playClick(): void {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    private playSuccess(): void {
        if (!this.audioContext) return;

        // Happy ascending notes
        [400, 500, 600, 800].forEach((freq, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext!.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.1);

            gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + i * 0.1 + 0.15);

            osc.start(this.audioContext!.currentTime + i * 0.1);
            osc.stop(this.audioContext!.currentTime + i * 0.1 + 0.15);
        });
    }
}

export const soundManager = SoundManager.getInstance();
export default soundManager;
