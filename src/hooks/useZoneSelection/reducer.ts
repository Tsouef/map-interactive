import type { Zone } from '@/types';
import type { SelectionState, SelectionSource } from './types';

/**
 * Action types for selection reducer
 */
export type SelectionAction =
  | { type: 'SELECT_ZONE'; payload: { zone: Zone; source: SelectionSource } }
  | { type: 'DESELECT_ZONE'; payload: { zoneId: string } }
  | { type: 'SELECT_MULTIPLE'; payload: { zones: Zone[] } }
  | { type: 'DESELECT_MULTIPLE'; payload: { zoneIds: string[] } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_MODE'; payload: { mode: SelectionState['mode'] } }
  | { type: 'RESTORE_STATE'; payload: SelectionState };

/**
 * Selection state reducer
 */
export function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case 'SELECT_ZONE': {
      const { zone } = action.payload;
      
      // If already selected, return current state
      if (state.selectedIds.has(zone.id)) {
        return state;
      }

      // Handle single selection mode
      if (state.mode === 'single') {
        return {
          ...state,
          selectedIds: new Set([zone.id]),
          selectionOrder: [zone.id],
          lastSelectedId: zone.id
        };
      }

      // Add to selection
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.add(zone.id);
      
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionOrder: [...state.selectionOrder, zone.id],
        lastSelectedId: zone.id
      };
    }

    case 'DESELECT_ZONE': {
      const { zoneId } = action.payload;
      
      // If not selected, return current state
      if (!state.selectedIds.has(zoneId)) {
        return state;
      }

      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(zoneId);
      
      const newSelectionOrder = state.selectionOrder.filter(id => id !== zoneId);
      
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionOrder: newSelectionOrder,
        lastSelectedId: newSelectionOrder[newSelectionOrder.length - 1]
      };
    }

    case 'SELECT_MULTIPLE': {
      const { zones } = action.payload;
      
      // Handle single selection mode
      if (state.mode === 'single' && zones.length > 0) {
        const lastZone = zones[zones.length - 1];
        return {
          ...state,
          selectedIds: new Set([lastZone.id]),
          selectionOrder: [lastZone.id],
          lastSelectedId: lastZone.id
        };
      }

      const newSelectedIds = new Set(state.selectedIds);
      const newZoneIds: string[] = [];
      
      zones.forEach(zone => {
        if (!newSelectedIds.has(zone.id)) {
          newSelectedIds.add(zone.id);
          newZoneIds.push(zone.id);
        }
      });

      if (newZoneIds.length === 0) {
        return state;
      }
      
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionOrder: [...state.selectionOrder, ...newZoneIds],
        lastSelectedId: newZoneIds[newZoneIds.length - 1]
      };
    }

    case 'DESELECT_MULTIPLE': {
      const { zoneIds } = action.payload;
      const idsToRemove = new Set(zoneIds);
      
      const newSelectedIds = new Set(
        Array.from(state.selectedIds).filter(id => !idsToRemove.has(id))
      );
      
      const newSelectionOrder = state.selectionOrder.filter(
        id => !idsToRemove.has(id)
      );
      
      return {
        ...state,
        selectedIds: newSelectedIds,
        selectionOrder: newSelectionOrder,
        lastSelectedId: newSelectionOrder[newSelectionOrder.length - 1]
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedIds: new Set(),
        selectionOrder: [],
        lastSelectedId: undefined
      };

    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload.mode
      };

    case 'RESTORE_STATE':
      return action.payload;

    default:
      return state;
  }
}