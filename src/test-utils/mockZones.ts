import type { Zone } from '@/components/ZoneLayer/types';
import type { Polygon, Position } from 'geojson';

/**
 * Creates a mock zone for testing
 */
export function createMockZone(
  id: string,
  coordinates: Position[],
  name?: string,
  properties?: Record<string, unknown>
): Zone {
  // Ensure the polygon is closed
  const closedCoordinates = [...coordinates];
  if (closedCoordinates.length > 0) {
    const first = closedCoordinates[0];
    const last = closedCoordinates[closedCoordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closedCoordinates.push(first);
    }
  }

  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: [closedCoordinates]
  };

  // Calculate bbox
  const lngs = coordinates.map(coord => coord[0]);
  const lats = coordinates.map(coord => coord[1]);
  const bbox: [number, number, number, number] = [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats)
  ];

  return {
    id,
    name: name || `Zone ${id}`,
    geometry,
    properties: properties || {},
    bbox
  };
}

/**
 * Creates multiple adjacent mock zones
 */
export function createAdjacentZones(count: number = 3): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseX = i;
    const coordinates: Position[] = [
      [baseX, 0],
      [baseX, 1],
      [baseX + 1, 1],
      [baseX + 1, 0],
      [baseX, 0]
    ];
    
    zones.push(createMockZone(
      `zone-${i + 1}`,
      coordinates,
      `Zone ${i + 1}`,
      { index: i }
    ));
  }
  
  return zones;
}

/**
 * Creates a complex polygon zone with hole
 */
export function createComplexZone(id: string = 'complex-zone'): Zone {
  const outerRing: Position[] = [
    [0, 0],
    [0, 4],
    [4, 4],
    [4, 0],
    [0, 0]
  ];
  
  const hole: Position[] = [
    [1, 1],
    [1, 3],
    [3, 3],
    [3, 1],
    [1, 1]
  ];

  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: [outerRing, hole]
  };

  return {
    id,
    name: 'Complex Zone',
    geometry,
    bbox: [0, 0, 4, 4]
  };
}

/**
 * Creates a large dataset of random zones for performance testing
 */
export function createLargeZoneDataset(count: number = 1000): Zone[] {
  const zones: Zone[] = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    // Add some randomness to positions
    const baseX = col * 0.1 + (Math.random() - 0.5) * 0.02;
    const baseY = row * 0.1 + (Math.random() - 0.5) * 0.02;
    const size = 0.08 + Math.random() * 0.02;
    
    const coordinates: Position[] = [
      [baseX, baseY],
      [baseX, baseY + size],
      [baseX + size, baseY + size],
      [baseX + size, baseY],
      [baseX, baseY]
    ];
    
    zones.push(createMockZone(
      `zone-${i}`,
      coordinates,
      `Zone ${i}`,
      { 
        population: Math.floor(Math.random() * 100000),
        area: size * size
      }
    ));
  }
  
  return zones;
}

/**
 * Mock Leaflet event
 */
export function createMockLeafletEvent(type: string = 'click'): {
  type: string;
  target: {
    setStyle: jest.Mock;
    getElement: jest.Mock;
  };
  latlng: { lat: number; lng: number };
  originalEvent: {
    stopPropagation: jest.Mock;
    preventDefault: jest.Mock;
  };
} {
  return {
    type,
    target: {
      setStyle: jest.fn(),
      getElement: jest.fn(() => ({
        setAttribute: jest.fn()
      }))
    },
    latlng: { lat: 0, lng: 0 },
    originalEvent: {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn()
    }
  };
}