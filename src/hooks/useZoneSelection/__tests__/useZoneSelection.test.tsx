import { renderHook, act } from '@testing-library/react';
import { useZoneSelection } from '../useZoneSelection';
import { createMockZone } from '@/test-utils/mockZones';
import type { Zone, SelectionChangeEvent, SelectionError } from '../types';

describe('useZoneSelection', () => {
  let mockZones: Zone[];

  beforeEach(() => {
    // Create mock zones
    mockZones = [
      createMockZone('zone-1', { name: 'Zone 1' }),
      createMockZone('zone-2', { name: 'Zone 2' }),
      createMockZone('zone-3', { name: 'Zone 3' }),
      createMockZone('zone-4', { name: 'Zone 4' }),
      createMockZone('zone-5', { name: 'Zone 5' })
    ];
  });

  describe('Basic Selection', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      expect(result.current.selectedZones).toEqual([]);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.hoveredZone).toBeNull();
    });

    it('should initialize with provided selection', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, {
          initialSelection: ['zone-1', 'zone-3']
        })
      );

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.selectedIds.has('zone-1')).toBe(true);
      expect(result.current.selectedIds.has('zone-3')).toBe(true);
    });

    it('should select a zone', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { onSelectionChange })
      );

      act(() => {
        result.current.selectZone(mockZones[0]);
      });

      expect(result.current.selectedZones).toHaveLength(1);
      expect(result.current.selectedZones[0].id).toBe('zone-1');
      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          added: [mockZones[0]],
          removed: [],
          current: [mockZones[0]],
          source: 'api'
        })
      );
    });

    it('should deselect a zone', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { 
          initialSelection: ['zone-1'],
          onSelectionChange 
        })
      );

      act(() => {
        result.current.deselectZone('zone-1');
      });

      expect(result.current.selectedZones).toHaveLength(0);
      expect(result.current.isZoneSelected('zone-1')).toBe(false);
      
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          added: [],
          removed: [mockZones[0]],
          current: [],
          source: 'api'
        })
      );
    });

    it('should toggle zone selection', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      // First toggle - should select
      act(() => {
        result.current.toggleZone('zone-1');
      });
      expect(result.current.isZoneSelected('zone-1')).toBe(true);

      // Second toggle - should deselect
      act(() => {
        result.current.toggleZone('zone-1');
      });
      expect(result.current.isZoneSelected('zone-1')).toBe(false);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, {
          initialSelection: ['zone-1', 'zone-2', 'zone-3']
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedZones).toHaveLength(0);
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('Single Selection Mode', () => {
    it('should only allow one selection in single mode', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { 
          multiSelect: false 
        })
      );

      act(() => {
        result.current.selectZone(mockZones[0]);
        result.current.selectZone(mockZones[1]);
      });

      expect(result.current.selectedZones).toHaveLength(1);
      expect(result.current.selectedZones[0].id).toBe('zone-2');
    });
  });

  describe('Multi Selection', () => {
    it('should select multiple zones', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      act(() => {
        result.current.selectMultiple(['zone-1', 'zone-2', 'zone-3']);
      });

      expect(result.current.selectedZones).toHaveLength(3);
      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      expect(result.current.isZoneSelected('zone-2')).toBe(true);
      expect(result.current.isZoneSelected('zone-3')).toBe(true);
    });

    it('should deselect multiple zones', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, {
          initialSelection: ['zone-1', 'zone-2', 'zone-3', 'zone-4']
        })
      );

      act(() => {
        result.current.deselectMultiple(['zone-2', 'zone-4']);
      });

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      expect(result.current.isZoneSelected('zone-3')).toBe(true);
      expect(result.current.isZoneSelected('zone-2')).toBe(false);
      expect(result.current.isZoneSelected('zone-4')).toBe(false);
    });

    it('should select all zones', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedZones).toHaveLength(5);
      mockZones.forEach(zone => {
        expect(result.current.isZoneSelected(zone.id)).toBe(true);
      });
    });
  });

  describe('Selection Constraints', () => {
    it('should enforce max selections', () => {
      const onSelectionError = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { 
          maxSelections: 2,
          onSelectionError 
        })
      );

      act(() => {
        result.current.selectMultiple(['zone-1', 'zone-2', 'zone-3']);
      });

      expect(result.current.selectedZones).toHaveLength(0);
      expect(onSelectionError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_FAILED',
          message: expect.any(String)
        })
      );
    });

    it('should validate custom constraints', () => {
      const customValidator = jest.fn(() => ({
        valid: false,
        errors: ['Custom validation failed']
      }));

      const onSelectionError = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { 
          constraints: { customValidator },
          onSelectionError 
        })
      );

      act(() => {
        result.current.selectZone('zone-1');
      });

      expect(customValidator).toHaveBeenCalled();
      expect(result.current.selectedZones).toHaveLength(0);
      expect(onSelectionError).toHaveBeenCalled();
    });
  });

  describe('History Management', () => {
    it('should undo selection changes', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { enableHistory: true })
      );

      // Make some selections
      act(() => {
        result.current.selectZone('zone-1');
      });
      act(() => {
        result.current.selectZone('zone-2');
      });

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.canUndo).toBe(true);

      // Undo last selection
      act(() => {
        result.current.undo();
      });

      expect(result.current.selectedZones).toHaveLength(1);
      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      expect(result.current.isZoneSelected('zone-2')).toBe(false);
    });

    it('should redo selection changes', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, { enableHistory: true })
      );

      // Make selection and undo
      act(() => {
        result.current.selectZone('zone-1');
        result.current.selectZone('zone-2');
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Redo
      act(() => {
        result.current.redo();
      });

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.isZoneSelected('zone-2')).toBe(true);
    });
  });

  describe('Advanced Selection', () => {
    it('should select by predicate', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      act(() => {
        result.current.selectByPredicate(zone => 
          zone.name.includes('2') || zone.name.includes('4')
        );
      });

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.isZoneSelected('zone-2')).toBe(true);
      expect(result.current.isZoneSelected('zone-4')).toBe(true);
    });

    it('should get selection metrics', () => {
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, {
          initialSelection: ['zone-1', 'zone-2']
        })
      );

      const metrics = result.current.getSelectionMetrics();

      expect(metrics.count).toBe(2);
      expect(metrics.totalArea).toBeGreaterThan(0);
      expect(metrics.totalPerimeter).toBeGreaterThan(0);
      expect(metrics.largestZone).toBeTruthy();
      expect(metrics.smallestZone).toBeTruthy();
    });
  });

  describe('Hover State', () => {
    it('should set hovered zone', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      act(() => {
        result.current.setHoveredZone(mockZones[0]);
      });

      expect(result.current.hoveredZone).toEqual(mockZones[0]);

      act(() => {
        result.current.setHoveredZone(null);
      });

      expect(result.current.hoveredZone).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should export and load selection', () => {
      const { result } = renderHook(() => useZoneSelection(mockZones));

      // Make selection
      act(() => {
        result.current.selectMultiple(['zone-1', 'zone-3', 'zone-5']);
      });

      // Export selection
      const exported = result.current.exportSelection();
      expect(exported).toEqual(['zone-1', 'zone-3', 'zone-5']);

      // Clear and reload
      act(() => {
        result.current.clearSelection();
        result.current.loadSelection(exported);
      });

      expect(result.current.selectedZones).toHaveLength(3);
      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      expect(result.current.isZoneSelected('zone-3')).toBe(true);
      expect(result.current.isZoneSelected('zone-5')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should batch updates when enabled', async () => {
      jest.useFakeTimers();
      const onSelectionChange = jest.fn();
      
      const { result } = renderHook(() => 
        useZoneSelection(mockZones, {
          batchUpdates: true,
          debounceMs: 100,
          onSelectionChange
        })
      );

      // Make rapid selections
      act(() => {
        result.current.selectZone('zone-1');
        result.current.selectZone('zone-2');
        result.current.selectZone('zone-3');
      });

      // Callbacks shouldn't be called yet
      expect(onSelectionChange).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Now callbacks should be called
      expect(onSelectionChange).toHaveBeenCalled();
      expect(result.current.selectedZones).toHaveLength(3);

      jest.useRealTimers();
    });
  });
});