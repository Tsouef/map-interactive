import type {
  ZoneEvents,
  MapEvents,
  DrawingEvents,
  DrawingMode,
} from '../events';
import type { Zone } from '../zone';
import type { LeafletMouseEvent } from 'leaflet';
import type { Coordinates } from '../geography';

describe('Event Types', () => {
  const mockZone: Zone = {
    id: 'test-1',
    name: 'Test Zone',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
  };

  const mockMouseEvent = {} as LeafletMouseEvent;

  it('should accept valid ZoneEvents', () => {
    const events: ZoneEvents = {
      onZoneClick: (zone: Zone, event: LeafletMouseEvent) => {
        console.log(zone.id, event);
      },
      onZoneDoubleClick: (zone: Zone, event: LeafletMouseEvent) => {
        console.log(zone.id, event);
      },
      onZoneMouseEnter: (zone: Zone, event: LeafletMouseEvent) => {
        console.log(zone.id, event);
      },
      onZoneMouseLeave: (zone: Zone, event: LeafletMouseEvent) => {
        console.log(zone.id, event);
      },
      onZoneContextMenu: (zone: Zone, event: LeafletMouseEvent) => {
        console.log(zone.id, event);
      },
    };
    
    expect(events.onZoneClick).toBeDefined();
    expect(typeof events.onZoneClick).toBe('function');
  });

  it('should accept partial ZoneEvents', () => {
    const events: ZoneEvents = {
      onZoneClick: (zone) => {
        console.log(zone.id);
      },
    };
    
    expect(events.onZoneClick).toBeDefined();
    expect(events.onZoneDoubleClick).toBeUndefined();
  });

  it('should accept valid MapEvents', () => {
    const events: MapEvents = {
      onMapClick: () => {
        console.log('Map clicked');
      },
      onMapMoveEnd: (center: Coordinates, zoom: number) => {
        console.log(center, zoom);
      },
      onMapZoomEnd: (zoom: number) => {
        console.log(zoom);
      },
    };
    
    expect(events.onMapClick).toBeDefined();
    expect(events.onMapMoveEnd).toBeDefined();
    expect(events.onMapZoomEnd).toBeDefined();
  });

  it('should accept valid DrawingEvents', () => {
    const events: DrawingEvents = {
      onDrawStart: (mode: DrawingMode) => {
        console.log(mode);
      },
      onDrawComplete: (geometry) => {
        console.log(geometry);
      },
      onDrawCancel: () => {
        console.log('cancelled');
      },
      onDrawVertex: (vertex: Coordinates) => {
        console.log(vertex);
      },
    };
    
    expect(events.onDrawStart).toBeDefined();
    expect(events.onDrawComplete).toBeDefined();
  });

  it('should accept all DrawingMode values', () => {
    const modes: DrawingMode[] = ['polygon', 'rectangle', 'circle', 'freehand'];
    
    modes.forEach(mode => {
      expect(modes).toContain(mode);
    });
  });

  it('should handle event callbacks with proper types', () => {
    const zoneClick = jest.fn();
    const mapMove = jest.fn();
    const drawStart = jest.fn();

    const zoneEvents: ZoneEvents = {
      onZoneClick: zoneClick,
    };

    const mapEvents: MapEvents = {
      onMapMoveEnd: mapMove,
    };

    const drawingEvents: DrawingEvents = {
      onDrawStart: drawStart,
    };

    // Simulate events
    zoneEvents.onZoneClick!(mockZone, mockMouseEvent);
    mapEvents.onMapMoveEnd!([12.5, 41.9], 10);
    drawingEvents.onDrawStart!('polygon');

    expect(zoneClick).toHaveBeenCalledWith(mockZone, mockMouseEvent);
    expect(mapMove).toHaveBeenCalledWith([12.5, 41.9], 10);
    expect(drawStart).toHaveBeenCalledWith('polygon');
  });
});