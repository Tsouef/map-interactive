import type { SelectionState } from './types';

/**
 * Manages undo/redo history for zone selection
 */
export class SelectionHistory {
  private history: SelectionState[] = [];
  private currentIndex = -1;
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Add a new state to history
   */
  push(state: SelectionState): void {
    // Remove any states after current index (when pushing after undo)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Deep clone the state to avoid mutations
    const clonedState: SelectionState = {
      ...state,
      selectedIds: new Set(state.selectedIds),
      selectionOrder: [...state.selectionOrder],
      constraints: state.constraints ? { ...state.constraints } : undefined
    };

    // Add new state
    this.history.push(clonedState);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(this.history.length - this.maxSize);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Get previous state
   */
  undo(): SelectionState | null {
    if (!this.canUndo()) {
      return null;
    }

    // Don't decrement yet - we need to return the state at currentIndex - 1
    const previousState = this.history[this.currentIndex - 1];
    this.currentIndex--;
    return this.cloneState(previousState);
  }

  /**
   * Get next state
   */
  redo(): SelectionState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.cloneState(this.history[this.currentIndex]);
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get current history size
   */
  size(): number {
    return this.history.length;
  }

  /**
   * Clone a state to avoid mutations
   */
  private cloneState(state: SelectionState): SelectionState {
    return {
      ...state,
      selectedIds: new Set(state.selectedIds),
      selectionOrder: [...state.selectionOrder],
      constraints: state.constraints ? { ...state.constraints } : undefined
    };
  }
}