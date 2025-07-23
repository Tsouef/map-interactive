import { SelectionHistory } from '../history';
import type { SelectionState } from '../types';

describe('SelectionHistory', () => {
  let history: SelectionHistory;
  
  const createState = (ids: string[]): SelectionState => ({
    selectedIds: new Set(ids),
    selectionOrder: ids,
    lastSelectedId: ids[ids.length - 1],
    mode: 'multiple',
    constraints: undefined
  });

  beforeEach(() => {
    history = new SelectionHistory();
  });

  describe('Basic functionality', () => {
    it('should initialize with empty history', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(0);
    });

    it('should push state to history', () => {
      const state1 = createState(['zone-1']);
      history.push(state1);
      
      expect(history.size()).toBe(1);
      expect(history.canUndo()).toBe(false); // Can't undo when only one state
      expect(history.canRedo()).toBe(false);
    });

    it('should allow undo after multiple states', () => {
      const state1 = createState([]);
      const state2 = createState(['zone-1']);
      
      history.push(state1);
      history.push(state2);
      
      expect(history.size()).toBe(2);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });

    it('should return previous state on undo', () => {
      const state1 = createState([]);
      const state2 = createState(['zone-1']);
      const state3 = createState(['zone-1', 'zone-2']);
      
      history.push(state1);
      history.push(state2);
      history.push(state3);
      
      // Undo from state3 to state2
      const previousState = history.undo();
      expect(previousState).toBeTruthy();
      expect(previousState?.selectionOrder).toEqual(['zone-1']);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(true);
      
      // Undo from state2 to state1
      const previousState2 = history.undo();
      expect(previousState2).toBeTruthy();
      expect(previousState2?.selectionOrder).toEqual([]);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });

    it('should return next state on redo', () => {
      const state1 = createState([]);
      const state2 = createState(['zone-1']);
      const state3 = createState(['zone-1', 'zone-2']);
      
      history.push(state1);
      history.push(state2);
      history.push(state3);
      
      // Undo twice
      history.undo();
      history.undo();
      
      // Redo to state2
      const nextState = history.redo();
      expect(nextState).toBeTruthy();
      expect(nextState?.selectionOrder).toEqual(['zone-1']);
      
      // Redo to state3
      const nextState2 = history.redo();
      expect(nextState2).toBeTruthy();
      expect(nextState2?.selectionOrder).toEqual(['zone-1', 'zone-2']);
      expect(history.canRedo()).toBe(false);
    });

    it('should clear future history when pushing after undo', () => {
      const state1 = createState([]);
      const state2 = createState(['zone-1']);
      const state3 = createState(['zone-1', 'zone-2']);
      const state4 = createState(['zone-3']);
      
      history.push(state1);
      history.push(state2);
      history.push(state3);
      
      // Undo once
      history.undo();
      expect(history.canRedo()).toBe(true);
      
      // Push new state
      history.push(state4);
      
      // Should not be able to redo anymore
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(3); // state1, state2, state4
    });

    it('should handle clear operation', () => {
      history.push(createState([]));
      history.push(createState(['zone-1']));
      
      expect(history.size()).toBe(2);
      
      history.clear();
      
      expect(history.size()).toBe(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });

    it('should respect max size limit', () => {
      const smallHistory = new SelectionHistory(3);
      
      smallHistory.push(createState(['1']));
      smallHistory.push(createState(['2']));
      smallHistory.push(createState(['3']));
      smallHistory.push(createState(['4']));
      
      expect(smallHistory.size()).toBe(3);
      
      // Should still be able to undo
      const state = smallHistory.undo();
      expect(state?.selectionOrder).toEqual(['3']);
    });

    it('should deep clone states to avoid mutations', () => {
      const originalState = createState(['zone-1']);
      history.push(originalState);
      
      // Mutate original state
      originalState.selectionOrder.push('zone-2');
      originalState.selectedIds.add('zone-2');
      
      // Push another state
      history.push(createState(['zone-1', 'zone-2', 'zone-3']));
      
      // Undo should return unmutated state
      const previousState = history.undo();
      expect(previousState?.selectionOrder).toEqual(['zone-1']);
      expect(previousState?.selectedIds.has('zone-2')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return null when undo not possible', () => {
      expect(history.undo()).toBeNull();
      
      history.push(createState([]));
      expect(history.undo()).toBeNull();
    });

    it('should return null when redo not possible', () => {
      expect(history.redo()).toBeNull();
      
      history.push(createState([]));
      history.push(createState(['zone-1']));
      expect(history.redo()).toBeNull();
    });
  });
});