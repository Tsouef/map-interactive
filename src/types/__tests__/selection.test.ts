import type {
  SelectionState,
  SelectionMode,
  SelectionConstraints,
  SelectionChangeEvent,
} from '../selection';
import type { Zone } from '../zone';
import type { Polygon } from 'geojson';

describe('Selection Types', () => {
  const mockZone: Zone = {
    id: 'test-1',
    name: 'Test Zone',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    } as Polygon,
  };

  it('should accept valid SelectionState', () => {
    const state: SelectionState = {
      selectedIds: new Set(['zone-1', 'zone-2']),
      selectionOrder: ['zone-1', 'zone-2'],
      lastSelectedId: 'zone-2',
      mode: 'multiple',
    };
    
    expect(state.selectedIds.size).toBe(2);
    expect(state.selectionOrder).toHaveLength(2);
    expect(state.mode).toBe('multiple');
  });

  it('should accept SelectionState with constraints', () => {
    const state: SelectionState = {
      selectedIds: new Set(),
      selectionOrder: [],
      mode: 'single',
      constraints: {
        maxSelections: 5,
        minSelections: 1,
        maxArea: 1000000,
        minArea: 100,
        adjacentOnly: true,
        validate: (_zones: Zone[]) => _zones.length > 0,
      },
    };
    
    expect(state.constraints?.maxSelections).toBe(5);
    expect(state.constraints?.adjacentOnly).toBe(true);
  });

  it('should accept all SelectionMode values', () => {
    const modes: SelectionMode[] = ['single', 'multiple', 'range', 'adjacent'];
    
    modes.forEach(mode => {
      const state: SelectionState = {
        selectedIds: new Set(),
        selectionOrder: [],
        mode,
      };
      expect(state.mode).toBe(mode);
    });
  });

  it('should accept valid SelectionConstraints', () => {
    const constraints: SelectionConstraints = {
      maxSelections: 10,
      minSelections: 2,
      maxArea: 5000000,
      minArea: 1000,
      adjacentOnly: false,
      validate: (_zones) => {
        return _zones.length >= 2 || 'At least 2 zones required';
      },
    };
    
    expect(constraints.maxSelections).toBe(10);
    expect(typeof constraints.validate).toBe('function');
  });

  it('should accept valid SelectionChangeEvent', () => {
    const event: SelectionChangeEvent = {
      added: [mockZone],
      removed: [],
      current: [mockZone],
      source: 'click',
    };
    
    expect(event.added).toHaveLength(1);
    expect(event.source).toBe('click');
  });

  it('should accept all source types in SelectionChangeEvent', () => {
    const sources = ['click', 'keyboard', 'api', 'draw'] as const;
    
    sources.forEach(source => {
      const event: SelectionChangeEvent = {
        added: [],
        removed: [],
        current: [],
        source,
      };
      expect(event.source).toBe(source);
    });
  });

  it('should validate function return types in constraints', () => {
    const constraints: SelectionConstraints = {
      validate: () => true, // returns boolean
    };
    
    const constraints2: SelectionConstraints = {
      validate: () => 'Error message', // returns string
    };
    
    expect(constraints.validate).toBeDefined();
    expect(constraints2.validate).toBeDefined();
  });
});