/**
 * Lingo Island - Main Entry Point
 * Educational 3D Language Learning Game
 */

import { Engine } from './core/Engine';
import { SceneManager } from './core/SceneManager';
import { AssetLoader } from './services/AssetLoader';
import { UIManager } from './ui/UIManager';
import { IslandScene } from './scenes/IslandScene';
import type { CharacterType } from './types';

// ============================================
// Game Configuration
// ============================================

const INITIAL_WORDS = ['apple', 'banana', 'cat', 'dog', 'elephant'];

// ============================================
// Game Class
// ============================================

class LingoIsland {
  private engine!: Engine;
  private sceneManager!: SceneManager;
  private assetLoader!: AssetLoader;
  private uiManager!: UIManager;
  
  private currentWordIndex: number = 0;
  private hintTier: number = 0;

  async initialize(): Promise<void> {
    console.log('🏝️ Lingo Island initializing...');

    // Get canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize core systems
    this.engine = Engine.getInstance(canvas);
    this.engine.setLoadingProgress('Initializing engine...');

    // Initialize services
    this.assetLoader = AssetLoader.getInstance();
    this.sceneManager = SceneManager.getInstance();
    
    // Initialize UI after engine
    this.uiManager = UIManager.getInstance();
    this.setupUICallbacks();

    // Create and register scenes
    this.engine.setLoadingProgress('Creating world...');
    const islandScene = new IslandScene();
    this.sceneManager.register(islandScene);

    // Check server connection
    this.engine.setLoadingProgress('Connecting to server...');
    await this.checkServerConnection();

    // Load initial scene
    this.engine.setLoadingProgress('Loading island...');
    await this.sceneManager.switchTo('island');

    // Ready!
    this.engine.setLoadingProgress('Ready!');
    
    // Transition to character select
    setTimeout(() => {
      this.engine.state = 'character-select';
    }, 500);

    console.log('🏝️ Lingo Island ready!');
  }

  /**
   * Check server connection
   */
  private async checkServerConnection(): Promise<void> {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.success) {
        console.log('[Server] Connected:', data);
        
        if (!data.services.meshyApi) {
          console.warn('[Server] Meshy API not configured - 3D generation disabled');
          this.uiManager.showToast('Demo mode: 3D generation disabled', 3000);
        }
      }
    } catch (error) {
      console.warn('[Server] Not available - running in offline mode');
      this.uiManager.showToast('Offline mode', 2000);
    }
  }

  /**
   * Setup UI callbacks
   */
  private setupUICallbacks(): void {
    // Character selection
    this.uiManager.onCharacterSelected((character: CharacterType) => {
      this.onCharacterSelected(character);
    });

    // Hint button
    this.uiManager.onHint(() => {
      this.showNextHint();
    });

    // Mic button
    this.uiManager.onMic(() => {
      this.startVoiceRecognition();
    });

    // Skip button
    this.uiManager.onSkip(() => {
      this.skipWord();
    });
  }

  /**
   * Handle character selection
   */
  private onCharacterSelected(character: CharacterType): void {
    console.log(`[Game] Character selected: ${character}`);
    
    this.engine.selectCharacter(character);
    this.uiManager.hideCharacterSelect();
    this.engine.state = 'playing';
    
    // Start game with first word
    this.showCurrentWord();
  }

  /**
   * Show current word
   */
  private showCurrentWord(): void {
    const word = INITIAL_WORDS[this.currentWordIndex];
    this.hintTier = 0;
    
    this.uiManager.showWord(word, this.getHintForWord(word));
    
    // Try to load 3D model
    this.load3DWord(word);
  }

  /**
   * Get hint for word
   */
  private getHintForWord(word: string): string {
    const hints: Record<string, string> = {
      'apple': 'A red or green fruit',
      'banana': 'A yellow curved fruit',
      'cat': 'A furry pet that meows',
      'dog': 'A loyal pet that barks',
      'elephant': 'A big gray animal with a trunk',
    };
    return hints[word] || 'Can you say this word?';
  }

  /**
   * Load 3D model for word
   */
  private async load3DWord(word: string): Promise<void> {
    try {
      console.log(`[Game] Loading 3D model: ${word}`);
      const entity = await this.assetLoader.getEntity(word);
      
      // Position in scene
      entity.setPosition(
        Math.random() * 4 - 2,
        1.5,
        Math.random() * 4 - 2
      );
      entity.setLocalScale(0.5, 0.5, 0.5);
      
      // Add to scene
      const scene = this.sceneManager.get('island') as IslandScene;
      if (scene) {
        scene.addWordCollectible(
          { keyword: word, modelUrl: '', position: entity.getPosition(), points: 100 },
          entity
        );
      }
      
      console.log(`[Game] 3D model loaded: ${word}`);
    } catch (error) {
      console.warn(`[Game] Could not load 3D model for ${word}:`, error);
    }
  }

  /**
   * Show next hint tier
   */
  private showNextHint(): void {
    const word = INITIAL_WORDS[this.currentWordIndex];
    this.hintTier = Math.min(this.hintTier + 1, 3);
    
    this.uiManager.showHint(word, this.hintTier);
    console.log(`[Game] Showing hint tier ${this.hintTier} for "${word}"`);
  }

  /**
   * Start voice recognition
   */
  private startVoiceRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.uiManager.showToast('Voice recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    this.uiManager.setMicListening(true);

    recognition.onresult = (event: any) => {
      const results = event.results[0];
      const transcript = results[0].transcript.toLowerCase().trim();
      const confidence = results[0].confidence;
      
      console.log(`[Speech] Heard: "${transcript}" (${Math.round(confidence * 100)}%)`);
      
      this.checkAnswer(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech] Error:', event.error);
      this.uiManager.setMicListening(false);
      this.uiManager.showToast('Could not hear you, try again');
    };

    recognition.onend = () => {
      this.uiManager.setMicListening(false);
    };

    recognition.start();
  }

  /**
   * Check spoken answer
   */
  private checkAnswer(transcript: string): void {
    const currentWord = INITIAL_WORDS[this.currentWordIndex].toLowerCase();
    
    // Check if the transcript contains the word
    if (transcript.includes(currentWord) || this.isSimilar(transcript, currentWord)) {
      this.onCorrectAnswer();
    } else {
      this.onWrongAnswer(transcript);
    }
  }

  /**
   * Simple similarity check
   */
  private isSimilar(a: string, b: string): boolean {
    const aClean = a.replace(/[^a-z]/g, '');
    const bClean = b.replace(/[^a-z]/g, '');
    
    // Check Levenshtein distance
    if (Math.abs(aClean.length - bClean.length) > 2) return false;
    
    let matches = 0;
    for (let i = 0; i < Math.min(aClean.length, bClean.length); i++) {
      if (aClean[i] === bClean[i]) matches++;
    }
    
    return matches / Math.max(aClean.length, bClean.length) > 0.7;
  }

  /**
   * Handle correct answer
   */
  private onCorrectAnswer(): void {
    const word = INITIAL_WORDS[this.currentWordIndex];
    const points = 100 - (this.hintTier * 20); // Less points if hints used
    
    this.engine.addScore(points);
    this.engine.incrementStreak();
    this.engine.addLearnedWord(word);
    
    this.uiManager.showSuccess(word, points);
    this.uiManager.updateScore(this.engine.progress.score);
    this.uiManager.updateStreak(this.engine.progress.streak);
    
    console.log(`[Game] Correct! +${points} points`);
    
    // Next word after delay
    setTimeout(() => {
      this.nextWord();
    }, 1500);
  }

  /**
   * Handle wrong answer
   */
  private onWrongAnswer(heard: string): void {
    this.engine.resetStreak();
    this.uiManager.updateStreak(0);
    this.uiManager.showError();
    this.uiManager.showToast(`Heard: "${heard}" - Try again!`);
    
    console.log(`[Game] Wrong answer: "${heard}"`);
  }

  /**
   * Skip current word
   */
  private skipWord(): void {
    this.engine.resetStreak();
    this.uiManager.updateStreak(0);
    this.nextWord();
  }

  /**
   * Go to next word
   */
  private nextWord(): void {
    this.currentWordIndex++;
    
    if (this.currentWordIndex >= INITIAL_WORDS.length) {
      this.onLevelComplete();
      return;
    }
    
    this.showCurrentWord();
  }

  /**
   * Handle level completion
   */
  private onLevelComplete(): void {
    console.log('[Game] Level complete!');
    this.uiManager.showToast('🎉 Level Complete!', 3000);
    
    // Reset for demo
    setTimeout(() => {
      this.currentWordIndex = 0;
      this.showCurrentWord();
    }, 3000);
  }
}

// ============================================
// Start the Game
// ============================================

const game = new LingoIsland();

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    game.initialize().catch(console.error);
  });
} else {
  game.initialize().catch(console.error);
}

export default game;
