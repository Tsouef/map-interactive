import { renderHook, act } from '@testing-library/react';
import { useZoneSelection } from '../useZoneSelection';
import type { Zone } from '../../types';

describe('useZoneSelection', () => {
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

  const mockZone3: Zone = {
    id: 'zone-3',
    name: 'Test Zone 3',
    coordinates: [[[2, 0], [2, 1], [3, 1], [3, 0], [2, 0]]],
    properties: { postalCode: '75003' }
  };

  describe('initial state', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useZoneSelection());

      expect(result.current.selectedZones).toEqual([]);
      expect(result.current.selectedZoneIds).toEqual(new Set());
      expect(result.current.hoveredZone).toBeNull();
    });

    it('should initialize with provided initial selection', () => {
      const initialSelection = [mockZone1, mockZone2];
      const { result } = renderHook(() => 
        useZoneSelection({ initialSelection })
      );

      expect(result.current.selectedZones).toEqual(initialSelection);
      expect(result.current.selectedZoneIds).toEqual(new Set(['zone-1', 'zone-2']));
    });
  });

  describe('selectZone', () => {
    it('should add zone to selection in multi-select mode', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true })
      );

      act(() => {
        result.current.selectZone(mockZone1);
      });

      expect(result.current.selectedZones).toEqual([mockZone1]);
      expect(result.current.selectedZoneIds).toEqual(new Set(['zone-1']));
    });

    it('should toggle zone selection when clicking selected zone', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true })
      );

      act(() => {
        result.current.selectZone(mockZone1);
      });

      expect(result.current.selectedZones).toEqual([mockZone1]);

      act(() => {
        result.current.selectZone(mockZone1);
      });

      expect(result.current.selectedZones).toEqual([]);
      expect(result.current.selectedZoneIds).toEqual(new Set());
    });

    it('should add multiple zones in multi-select mode', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true })
      );

      act(() => {
        result.current.selectZone(mockZone1);
        result.current.selectZone(mockZone2);
        result.current.selectZone(mockZone3);
      });

      expect(result.current.selectedZones).toHaveLength(3);
      expect(result.current.selectedZoneIds).toEqual(
        new Set(['zone-1', 'zone-2', 'zone-3'])
      );
    });

    it('should replace selection in single-select mode', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: false })
      );

      act(() => {
        result.current.selectZone(mockZone1);
      });

      expect(result.current.selectedZones).toEqual([mockZone1]);

      act(() => {
        result.current.selectZone(mockZone2);
      });

      expect(result.current.selectedZones).toEqual([mockZone2]);
      expect(result.current.selectedZoneIds).toEqual(new Set(['zone-2']));
    });

    it('should respect maxSelections limit', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true, maxSelections: 2 })
      );

      act(() => {
        result.current.selectZone(mockZone1);
        result.current.selectZone(mockZone2);
        result.current.selectZone(mockZone3);
      });

      expect(result.current.selectedZones).toHaveLength(2);
      expect(result.current.selectedZoneIds).toEqual(
        new Set(['zone-1', 'zone-2'])
      );
    });

    it('should call onSelectionChange callback', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection({ onSelectionChange })
      );

      act(() => {
        result.current.selectZone(mockZone1);
      });

      expect(onSelectionChange).toHaveBeenCalledWith([mockZone1]);
    });
  });

  describe('deselectZone', () => {
    it('should remove zone from selection', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ 
          multiSelect: true,
          initialSelection: [mockZone1, mockZone2] 
        })
      );

      act(() => {
        result.current.deselectZone('zone-1');
      });

      expect(result.current.selectedZones).toEqual([mockZone2]);
      expect(result.current.selectedZoneIds).toEqual(new Set(['zone-2']));
    });

    it('should handle deselecting non-existent zone', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ initialSelection: [mockZone1] })
      );

      act(() => {
        result.current.deselectZone('non-existent');
      });

      expect(result.current.selectedZones).toEqual([mockZone1]);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selected zones', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ 
          initialSelection: [mockZone1, mockZone2, mockZone3] 
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedZones).toEqual([]);
      expect(result.current.selectedZoneIds).toEqual(new Set());
    });

    it('should call onSelectionChange with empty array', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection({ 
          initialSelection: [mockZone1],
          onSelectionChange 
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('hover state', () => {
    it('should set hovered zone', () => {
      const { result } = renderHook(() => useZoneSelection());

      act(() => {
        result.current.setHoveredZone(mockZone1);
      });

      expect(result.current.hoveredZone).toEqual(mockZone1);
    });

    it('should clear hovered zone', () => {
      const { result } = renderHook(() => useZoneSelection());

      act(() => {
        result.current.setHoveredZone(mockZone1);
      });

      expect(result.current.hoveredZone).toEqual(mockZone1);

      act(() => {
        result.current.setHoveredZone(null);
      });

      expect(result.current.hoveredZone).toBeNull();
    });

    it('should call onHoverChange callback', () => {
      const onHoverChange = jest.fn();
      const { result } = renderHook(() => 
        useZoneSelection({ onHoverChange })
      );

      act(() => {
        result.current.setHoveredZone(mockZone1);
      });

      expect(onHoverChange).toHaveBeenCalledWith(mockZone1);

      act(() => {
        result.current.setHoveredZone(null);
      });

      expect(onHoverChange).toHaveBeenCalledWith(null);
    });
  });

  describe('isZoneSelected', () => {
    it('should return true for selected zones', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ initialSelection: [mockZone1, mockZone2] })
      );

      expect(result.current.isZoneSelected('zone-1')).toBe(true);
      expect(result.current.isZoneSelected('zone-2')).toBe(true);
    });

    it('should return false for non-selected zones', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ initialSelection: [mockZone1] })
      );

      expect(result.current.isZoneSelected('zone-2')).toBe(false);
      expect(result.current.isZoneSelected('non-existent')).toBe(false);
    });
  });

  describe('getCoordinates', () => {
    it('should return coordinates for all selected zones', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ initialSelection: [mockZone1, mockZone2] })
      );

      const coordinates = result.current.getCoordinates();

      expect(coordinates).toEqual([
        mockZone1.coordinates,
        mockZone2.coordinates
      ]);
    });

    it('should return empty array when no zones selected', () => {
      const { result } = renderHook(() => useZoneSelection());

      const coordinates = result.current.getCoordinates();

      expect(coordinates).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid selection/deselection', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true })
      );

      act(() => {
        result.current.selectZone(mockZone1);
        result.current.selectZone(mockZone1);
        result.current.selectZone(mockZone1);
      });

      expect(result.current.selectedZones).toEqual([mockZone1]);
    });

    it('should maintain selection order', () => {
      const { result } = renderHook(() => 
        useZoneSelection({ multiSelect: true })
      );

      act(() => {
        result.current.selectZone(mockZone3);
        result.current.selectZone(mockZone1);
        result.current.selectZone(mockZone2);
      });

      expect(result.current.selectedZones[0].id).toBe('zone-3');
      expect(result.current.selectedZones[1].id).toBe('zone-1');
      expect(result.current.selectedZones[2].id).toBe('zone-2');
    });
  });
});