import { selectionReducer, initialState } from '../selectionReducer';
import type { Zone } from '../../types';
import type { SelectionAction } from '../selectionReducer';

describe('selectionReducer', () => {
  const mockZone1: Zone = {
    id: 'zone-1',
    name: 'Test Zone 1',
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
    properties: { postalCode: '75001' }
  };

  const mockZone2: Zone = {
    id: 'zone-2',
    name: 'Test Zone 2',
    coordinates: [[[1, 0], [1, 1], [2, 1], [2, 0], [1, 0]]],
    properties: { postalCode: '75002' }
  };

  describe('SELECT action', () => {
    it('should add zone to empty selection', () => {
      const action: SelectionAction = {
        type: 'SELECT',
        payload: { zone: mockZone1 }
      };

      const state = selectionReducer(initialState, action);

      expect(state.selectedZones).toHaveLength(1);
      expect(state.selectedZones[0]).toEqual(mockZone1);
      expect(state.selectedZoneIds.has('zone-1')).toBe(true);
    });

    it('should toggle zone if already selected', () => {
      const initialStateWithZone = {
        selectedZones: [mockZone1],
        selectedZoneIds: new Set(['zone-1']),
        hoveredZone: null
      };

      const action: SelectionAction = {
        type: 'SELECT',
        payload: { zone: mockZone1 }
      };

      const state = selectionReducer(initialStateWithZone, action);

      expect(state.selectedZones).toHaveLength(0);
      expect(state.selectedZoneIds.has('zone-1')).toBe(false);
    });

    it('should add multiple zones in multi-select mode', () => {
      const stateWithZone1 = selectionReducer(initialState, {
        type: 'SELECT',
        payload: { zone: mockZone1, multiSelect: true }
      });

      const stateWithBoth = selectionReducer(stateWithZone1, {
        type: 'SELECT',
        payload: { zone: mockZone2, multiSelect: true }
      });

      expect(stateWithBoth.selectedZones).toHaveLength(2);
      expect(stateWithBoth.selectedZoneIds.has('zone-1')).toBe(true);
      expect(stateWithBoth.selectedZoneIds.has('zone-2')).toBe(true);
    });

    it('should replace selection in single-select mode', () => {
      const stateWithZone1 = {
        selectedZones: [mockZone1],
        selectedZoneIds: new Set(['zone-1']),
        hoveredZone: null
      };

      const action: SelectionAction = {
        type: 'SELECT',
        payload: { zone: mockZone2, multiSelect: false }
      };

      const state = selectionReducer(stateWithZone1, action);

      expect(state.selectedZones).toHaveLength(1);
      expect(state.selectedZones[0]).toEqual(mockZone2);
      expect(state.selectedZoneIds.has('zone-1')).toBe(false);
      expect(state.selectedZoneIds.has('zone-2')).toBe(true);
    });

    it('should respect maxSelections limit', () => {
      const stateWithZone1 = {
        selectedZones: [mockZone1],
        selectedZoneIds: new Set(['zone-1']),
        hoveredZone: null
      };

      const action: SelectionAction = {
        type: 'SELECT',
        payload: { zone: mockZone2, multiSelect: true, maxSelections: 1 }
      };

      const state = selectionReducer(stateWithZone1, action);

      expect(state.selectedZones).toHaveLength(1);
      expect(state.selectedZones[0]).toEqual(mockZone1);
    });
  });

  describe('DESELECT action', () => {
    it('should remove zone from selection', () => {
      const initialStateWithZones = {
        selectedZones: [mockZone1, mockZone2],
        selectedZoneIds: new Set(['zone-1', 'zone-2']),
        hoveredZone: null
      };

      const action: SelectionAction = {
        type: 'DESELECT',
        payload: { zoneId: 'zone-1' }
      };

      const state = selectionReducer(initialStateWithZones, action);

      expect(state.selectedZones).toHaveLength(1);
      expect(state.selectedZones[0]).toEqual(mockZone2);
      expect(state.selectedZoneIds.has('zone-1')).toBe(false);
      expect(state.selectedZoneIds.has('zone-2')).toBe(true);
    });

    it('should handle deselecting non-existent zone', () => {
      const initialStateWithZone = {
        selectedZones: [mockZone1],
        selectedZoneIds: new Set(['zone-1']),
        hoveredZone: null
      };

      const action: SelectionAction = {
        type: 'DESELECT',
        payload: { zoneId: 'non-existent' }
      };

      const state = selectionReducer(initialStateWithZone, action);

      expect(state).toEqual(initialStateWithZone);
    });
  });

  describe('CLEAR action', () => {
    it('should clear all selections', () => {
      const initialStateWithZones = {
        selectedZones: [mockZone1, mockZone2],
        selectedZoneIds: new Set(['zone-1', 'zone-2']),
        hoveredZone: null
      };

      const action: SelectionAction = { type: 'CLEAR' };

      const state = selectionReducer(initialStateWithZones, action);

      expect(state.selectedZones).toHaveLength(0);
      expect(state.selectedZoneIds.size).toBe(0);
      expect(state.hoveredZone).toBeNull();
    });
  });

  describe('SET_HOVER action', () => {
    it('should set hovered zone', () => {
      const action: SelectionAction = {
        type: 'SET_HOVER',
        payload: { zone: mockZone1 }
      };

      const state = selectionReducer(initialState, action);

      expect(state.hoveredZone).toEqual(mockZone1);
      expect(state.selectedZones).toHaveLength(0); // Should not affect selection
    });

    it('should clear hovered zone with null', () => {
      const stateWithHover = {
        ...initialState,
        hoveredZone: mockZone1
      };

      const action: SelectionAction = {
        type: 'SET_HOVER',
        payload: { zone: null }
      };

      const state = selectionReducer(stateWithHover, action);

      expect(state.hoveredZone).toBeNull();
    });
  });

  describe('SET_SELECTION action', () => {
    it('should set entire selection', () => {
      const zones = [mockZone1, mockZone2];
      const action: SelectionAction = {
        type: 'SET_SELECTION',
        payload: { zones }
      };

      const state = selectionReducer(initialState, action);

      expect(state.selectedZones).toEqual(zones);
      expect(state.selectedZoneIds).toEqual(new Set(['zone-1', 'zone-2']));
    });

    it('should handle empty selection', () => {
      const action: SelectionAction = {
        type: 'SET_SELECTION',
        payload: { zones: [] }
      };

      const state = selectionReducer(initialState, action);

      expect(state.selectedZones).toHaveLength(0);
      expect(state.selectedZoneIds.size).toBe(0);
    });
  });
});