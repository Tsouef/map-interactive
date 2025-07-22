import type { Zone } from '../types';

export interface SelectionState {
  selectedZones: Zone[];
  selectedZoneIds: Set<string>;
  hoveredZone: Zone | null;
}

export type SelectionAction =
  | {
      type: 'SELECT';
      payload: {
        zone: Zone;
        multiSelect?: boolean;
        maxSelections?: number;
      };
    }
  | {
      type: 'DESELECT';
      payload: {
        zoneId: string;
      };
    }
  | {
      type: 'CLEAR';
    }
  | {
      type: 'SET_HOVER';
      payload: {
        zone: Zone | null;
      };
    }
  | {
      type: 'SET_SELECTION';
      payload: {
        zones: Zone[];
      };
    };

export const initialState: SelectionState = {
  selectedZones: [],
  selectedZoneIds: new Set(),
  hoveredZone: null
};

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case 'SELECT': {
      const { zone, multiSelect = true, maxSelections } = action.payload;
      const isSelected = state.selectedZoneIds.has(zone.id);

      if (isSelected) {
        // Toggle deselection
        const newZones = state.selectedZones.filter(z => z.id !== zone.id);
        return {
          ...state,
          selectedZones: newZones,
          selectedZoneIds: new Set(newZones.map(z => z.id))
        };
      }

      if (!multiSelect) {
        // Single select mode - replace selection
        return {
          ...state,
          selectedZones: [zone],
          selectedZoneIds: new Set([zone.id])
        };
      }

      // Multi-select mode
      if (maxSelections && state.selectedZones.length >= maxSelections) {
        // Max selections reached
        return state;
      }

      const newZones = [...state.selectedZones, zone];
      return {
        ...state,
        selectedZones: newZones,
        selectedZoneIds: new Set(newZones.map(z => z.id))
      };
    }

    case 'DESELECT': {
      const { zoneId } = action.payload;
      
      if (!state.selectedZoneIds.has(zoneId)) {
        return state;
      }

      const newZones = state.selectedZones.filter(z => z.id !== zoneId);
      return {
        ...state,
        selectedZones: newZones,
        selectedZoneIds: new Set(newZones.map(z => z.id))
      };
    }

    case 'CLEAR':
      return {
        ...state,
        selectedZones: [],
        selectedZoneIds: new Set(),
        hoveredZone: null
      };

    case 'SET_HOVER':
      return {
        ...state,
        hoveredZone: action.payload.zone
      };

    case 'SET_SELECTION': {
      const { zones } = action.payload;
      return {
        ...state,
        selectedZones: zones,
        selectedZoneIds: new Set(zones.map(z => z.id))
      };
    }

    default:
      return state;
  }
}