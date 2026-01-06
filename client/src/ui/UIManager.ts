/**
 * UI Manager
 * Handles all HTML overlay UI interactions
 */

import { Engine } from '../core/Engine';
import type { UIElements, CharacterType } from '../types';

export class UIManager {
  private static instance: UIManager | null = null;
  
  private engine: Engine;
  private ui: UIElements;
  
  // Callbacks
  private onHintCallback?: () => void;
  private onMicCallback?: () => void;
  private onSkipCallback?: () => void;
  private onCharacterSelectCallback?: (character: CharacterType) => void;

  private constructor() {
    this.engine = Engine.getInstance();
    this.ui = this.engine.ui;
    
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Action buttons
    this.ui.btnHint.addEventListener('click', () => {
      this.onHintClick();
    });

    this.ui.btnMic.addEventListener('click', () => {
      this.onMicClick();
    });

    this.ui.btnSkip.addEventListener('click', () => {
      this.onSkipClick();
    });

    // Character selection
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
      card.addEventListener('click', () => {
        const character = card.getAttribute('data-character') as CharacterType;
        this.onCharacterSelect(character);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboard(e: KeyboardEvent): void {
    if (this.engine.state !== 'playing') return;

    switch (e.key.toLowerCase()) {
      case 'h':
        this.onHintClick();
        break;
      case 'm':
        this.onMicClick();
        break;
      case 'n':
        this.onSkipClick();
        break;
    }
  }

  /**
   * Hint button click
   */
  private onHintClick(): void {
    console.log('[UI] Hint clicked');
    this.animateButton(this.ui.btnHint);
    this.onHintCallback?.();
  }

  /**
   * Mic button click
   */
  private onMicClick(): void {
    console.log('[UI] Mic clicked');
    this.animateButton(this.ui.btnMic);
    this.onMicCallback?.();
  }

  /**
   * Skip button click
   */
  private onSkipClick(): void {
    console.log('[UI] Skip clicked');
    this.animateButton(this.ui.btnSkip);
    this.onSkipCallback?.();
  }

  /**
   * Character selection
   */
  private onCharacterSelect(character: CharacterType): void {
    console.log(`[UI] Character selected: ${character}`);
    
    // Highlight selected card
    const cards = document.querySelectorAll('.character-card');
    cards.forEach(card => {
      card.classList.remove('selected');
      if (card.getAttribute('data-character') === character) {
        card.classList.add('selected');
      }
    });

    this.onCharacterSelectCallback?.(character);
  }

  /**
   * Animate button press
   */
  private animateButton(button: HTMLButtonElement): void {
    button.style.transform = 'scale(0.9)';
    setTimeout(() => {
      button.style.transform = '';
    }, 100);
  }

  /**
   * Set hint callback
   */
  onHint(callback: () => void): void {
    this.onHintCallback = callback;
  }

  /**
   * Set mic callback
   */
  onMic(callback: () => void): void {
    this.onMicCallback = callback;
  }

  /**
   * Set skip callback
   */
  onSkip(callback: () => void): void {
    this.onSkipCallback = callback;
  }

  /**
   * Set character select callback
   */
  onCharacterSelected(callback: (character: CharacterType) => void): void {
    this.onCharacterSelectCallback = callback;
  }

  /**
   * Update score display
   */
  updateScore(score: number): void {
    this.ui.scoreValue.textContent = score.toString();
    
    // Animate score change
    this.ui.scoreValue.style.transform = 'scale(1.3)';
    setTimeout(() => {
      this.ui.scoreValue.style.transform = '';
    }, 200);
  }

  /**
   * Update streak display
   */
  updateStreak(streak: number): void {
    this.ui.streakValue.textContent = streak.toString();
    
    // Animate streak change
    this.ui.streakValue.style.transform = 'scale(1.3)';
    setTimeout(() => {
      this.ui.streakValue.style.transform = '';
    }, 200);
  }

  /**
   * Show word
   */
  showWord(word: string, hint?: string): void {
    this.ui.currentWord.textContent = word.toUpperCase();
    this.ui.currentHint.textContent = hint || '';
    this.ui.wordDisplay.style.display = 'block';
    
    // Animate word appearance
    this.ui.wordDisplay.style.transform = 'translateX(-50%) scale(0.8)';
    this.ui.wordDisplay.style.opacity = '0';
    
    setTimeout(() => {
      this.ui.wordDisplay.style.transition = 'all 0.3s ease-out';
      this.ui.wordDisplay.style.transform = 'translateX(-50%) scale(1)';
      this.ui.wordDisplay.style.opacity = '1';
    }, 50);
  }

  /**
   * Hide word
   */
  hideWord(): void {
    this.ui.wordDisplay.style.display = 'none';
  }

  /**
   * Show hint with progressive reveal (Smart Hints system)
   * Tier 1: Visual glow (handled in 3D)
   * Tier 2: Audio hint
   * Tier 3: Spelling mask (A _ _ _ E)
   */
  showHint(word: string, tier: number): void {
    switch (tier) {
      case 1:
        // Tier 1: Just show the hint text
        this.ui.currentHint.textContent = '💡 Look for the glowing item!';
        break;
      
      case 2:
        // Tier 2: Audio hint (would trigger speech synthesis)
        this.ui.currentHint.textContent = `🔊 Listen: "${word}"`;
        this.speakWord(word);
        break;
      
      case 3: {
        // Tier 3: Spelling mask
        const mask = this.createSpellingMask(word);
        this.ui.currentWord.textContent = mask;
        this.ui.currentHint.textContent = '✏️ Fill in the blanks!';
        break;
      }
    }
  }

  /**
   * Create spelling mask (A _ _ _ E)
   */
  private createSpellingMask(inputWord: string): string {
    const chars = inputWord.toUpperCase().split('');
    return chars.map((char, index) => {
      // Show first and last letter
      if (index === 0 || index === chars.length - 1) {
        return char;
      }
      // Show some letters for longer words
      if (inputWord.length > 5 && index % 2 === 0) {
        return char;
      }
      return '_';
    }).join(' ');
  }

  /**
   * Speak word using Web Speech API
   */
  private speakWord(word: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Show success feedback
   */
  showSuccess(_word: string, points: number): void {
    // Flash the word green
    this.ui.currentWord.style.color = '#4CAF50';
    this.ui.currentHint.textContent = `✨ +${points} points!`;
    
    setTimeout(() => {
      this.ui.currentWord.style.color = '';
    }, 1000);
  }

  /**
   * Show error feedback
   */
  showError(): void {
    // Flash the word red briefly
    this.ui.currentWord.style.color = '#f44336';
    
    setTimeout(() => {
      this.ui.currentWord.style.color = '';
    }, 500);
  }

  /**
   * Show mic listening state
   */
  setMicListening(isListening: boolean): void {
    if (isListening) {
      this.ui.btnMic.style.background = 'linear-gradient(135deg, #FF3D3D, #FF6B6B)';
      this.ui.btnMic.textContent = '🔴';
    } else {
      this.ui.btnMic.style.background = '';
      this.ui.btnMic.textContent = '🎤';
    }
  }

  /**
   * Show character select modal
   */
  showCharacterSelect(): void {
    this.ui.characterSelect.classList.add('active');
  }

  /**
   * Hide character select modal
   */
  hideCharacterSelect(): void {
    this.ui.characterSelect.classList.remove('active');
  }

  /**
   * Show toast message
   */
  showToast(message: string, duration: number = 2000): void {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 10rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 2rem;
      font-size: 1rem;
      z-index: 1001;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export default UIManager;
