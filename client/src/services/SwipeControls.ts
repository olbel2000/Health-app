/**
 * Swipe Controls
 * Handles touch swipe and keyboard input for Word Ninja mode
 */

import type { SwipeDirection } from '../entities/RunnerController';

type SwipeCallback = (direction: SwipeDirection) => void;

export class SwipeControls {
  private callbacks: SwipeCallback[] = [];
  
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  
  private minSwipeDistance = 30;
  private maxSwipeTime = 500;
  
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    
    this.addListeners();
    this.setupControlButtons();
  }

  /**
   * Setup on-screen control buttons
   */
  private setupControlButtons(): void {
    const leftBtn = document.getElementById('btn-left');
    const rightBtn = document.getElementById('btn-right');
    const jumpBtn = document.getElementById('btn-jump');
    const slideBtn = document.getElementById('btn-slide');

    // Helper to handle both touch and click
    const addButtonHandler = (btn: HTMLElement | null, direction: SwipeDirection) => {
      if (!btn) return;
      
      // Touch events
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.emitSwipe(direction);
      }, { passive: false });
      
      // Mouse events
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.emitSwipe(direction);
      });
    };

    addButtonHandler(leftBtn, 'left');
    addButtonHandler(rightBtn, 'right');
    addButtonHandler(jumpBtn, 'up');
    addButtonHandler(slideBtn, 'down');
  }

  /**
   * Register swipe callback
   */
  onSwipe(callback: SwipeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Add event listeners
   */
  private addListeners(): void {
    // Touch events
    document.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
    document.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true });
    
    // Mouse events (for desktop testing)
    document.addEventListener('mousedown', this.boundHandleMouseDown);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
    
    // Keyboard events
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Remove event listeners
   */
  private removeListeners(): void {
    document.removeEventListener('touchstart', this.boundHandleTouchStart);
    document.removeEventListener('touchend', this.boundHandleTouchEnd);
    document.removeEventListener('mousedown', this.boundHandleMouseDown);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    this.processSwipe(touch.clientX, touch.clientY);
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchStartTime = Date.now();
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(e: MouseEvent): void {
    this.processSwipe(e.clientX, e.clientY);
  }

  /**
   * Process swipe gesture
   */
  private processSwipe(endX: number, endY: number): void {
    const dx = endX - this.touchStartX;
    const dy = endY - this.touchStartY;
    const dt = Date.now() - this.touchStartTime;
    
    // Check if swipe was quick enough
    if (dt > this.maxSwipeTime) return;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    // Check if swipe was long enough
    if (absDx < this.minSwipeDistance && absDy < this.minSwipeDistance) return;
    
    // Determine direction
    let direction: SwipeDirection;
    
    if (absDx > absDy) {
      // Horizontal swipe
      direction = dx > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = dy > 0 ? 'down' : 'up';
    }
    
    this.emitSwipe(direction);
  }

  /**
   * Handle keyboard input
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    let direction: SwipeDirection | null = null;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
        
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        direction = 'up';
        e.preventDefault();
        break;
        
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
    }
    
    if (direction) {
      this.emitSwipe(direction);
    }
  }

  /**
   * Emit swipe to all callbacks
   */
  private emitSwipe(direction: SwipeDirection): void {
    for (const callback of this.callbacks) {
      callback(direction);
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.removeListeners();
    this.callbacks = [];
  }
}

export default SwipeControls;
