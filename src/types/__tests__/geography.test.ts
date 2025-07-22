import type {
  Coordinates,
  CoordinateRing,
  CoordinateRings,
  BoundingBox,
  GeographicBounds,
} from '../geography';

describe('Geography Types', () => {
  it('should accept valid Coordinates', () => {
    const coords: Coordinates = [12.5, 41.9];
    expect(coords).toHaveLength(2);
    expect(typeof coords[0]).toBe('number');
    expect(typeof coords[1]).toBe('number');
  });

  it('should accept valid CoordinateRing', () => {
    const ring: CoordinateRing = [
      [12.5, 41.9],
      [12.6, 41.9],
      [12.6, 42.0],
      [12.5, 42.0],
      [12.5, 41.9],
    ];
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[ring.length - 1]); // Closed ring
  });

  it('should accept valid CoordinateRings', () => {
    const rings: CoordinateRings = [
      [
        [12.5, 41.9],
        [12.6, 41.9],
        [12.6, 42.0],
        [12.5, 42.0],
        [12.5, 41.9],
      ],
    ];
    expect(rings).toHaveLength(1);
    expect(rings[0]).toHaveLength(5);
  });

  it('should accept valid BoundingBox', () => {
    const bbox: BoundingBox = [12.5, 41.9, 12.6, 42.0];
    expect(bbox).toHaveLength(4);
    expect(bbox[0]).toBeLessThanOrEqual(bbox[2]); // minLon <= maxLon
    expect(bbox[1]).toBeLessThanOrEqual(bbox[3]); // minLat <= maxLat
  });

  it('should accept valid GeographicBounds', () => {
    const bounds: GeographicBounds = {
      north: 42.0,
      south: 41.9,
      east: 12.6,
      west: 12.5,
    };
    expect(bounds.north).toBeGreaterThanOrEqual(bounds.south);
    expect(bounds.east).toBeGreaterThanOrEqual(bounds.west);
  });
});