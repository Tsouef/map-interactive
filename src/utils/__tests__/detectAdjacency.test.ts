import { detectAdjacency, AdjacencyOptions } from '../detectAdjacency';
import * as turf from '@turf/turf';

describe('detectAdjacency', () => {
  describe('perfect adjacency', () => {
    it('should detect zones sharing a complete edge', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [1, 0],
        [2, 0],
        [2, 1],
        [1, 1],
        [1, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should detect zones sharing a partial edge', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [2, 0.5],
        [3, 0.5],
        [3, 1.5],
        [2, 1.5],
        [2, 0.5]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should detect zones sharing only a corner point', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });
  });

  describe('near adjacency with gap', () => {
    it('should detect zones within default tolerance (0.1%)', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [0.9999, 0],
        [0.9999, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [1.0001, 0],
        [2, 0],
        [2, 1],
        [1.0001, 1],
        [1.0001, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should not detect zones beyond default tolerance', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [0.99, 0],
        [0.99, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [1.01, 0],
        [2, 0],
        [2, 1],
        [1.01, 1],
        [1.01, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(false);
    });

    it('should respect custom tolerance options', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [0.95, 0],
        [0.95, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [1.05, 0],
        [2, 0],
        [2, 1],
        [1.05, 1],
        [1.05, 0]
      ]]);

      const options: AdjacencyOptions = {
        gapTolerance: 0.1 // 10% tolerance
      };

      expect(detectAdjacency(zone1, zone2, options)).toBe(true);
    });
  });

  describe('complex polygon shapes', () => {
    it('should detect adjacency for L-shaped polygons', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [2, 0],
        [2, 1],
        [1, 1],
        [1, 2],
        [0, 2],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [2, 0],
        [3, 0],
        [3, 2],
        [2, 2],
        [2, 1],
        [2, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should detect adjacency for concave polygons', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [2, 0],
        [2, 2],
        [1, 2],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [2, 0],
        [3, 0],
        [3, 1],
        [2.5, 1],
        [2.5, 2],
        [2, 2],
        [2, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });
  });

  describe('overlapping polygons', () => {
    it('should detect overlapping zones as adjacent', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [1.1, 0],
        [1.1, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [0.9, 0],
        [2, 0],
        [2, 1],
        [0.9, 1],
        [0.9, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });
  });

  describe('disjoint polygons', () => {
    it('should not detect completely separated zones', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [3, 0],
        [4, 0],
        [4, 1],
        [3, 1],
        [3, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(false);
    });
  });

  describe('performance', () => {
    it('should handle complex polygons efficiently', () => {
      // Create a complex polygon with many vertices
      const createComplexPolygon = (offsetX: number) => {
        const coords: [number, number][] = [];
        const numPoints = 100;
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const radius = 1 + 0.2 * Math.sin(angle * 5);
          coords.push([
            offsetX + radius * Math.cos(angle),
            radius * Math.sin(angle)
          ]);
        }
        coords.push(coords[0]); // Close the polygon
        
        return turf.polygon([coords]);
      };

      const zone1 = createComplexPolygon(0);
      const zone2 = createComplexPolygon(2.5); // Well beyond default adjacency

      const startTime = performance.now();
      const result = detectAdjacency(zone1, zone2);
      const endTime = performance.now();

      expect(result).toBe(false);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('edge cases', () => {
    it('should handle identical polygons', () => {
      const coords = [[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]];

      const zone1 = turf.polygon(coords);
      const zone2 = turf.polygon(coords);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should handle polygons with holes', () => {
      const zone1 = turf.polygon([
        // Outer ring
        [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]],
        // Hole
        [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]
      ]);

      const zone2 = turf.polygon([[
        [3, 0],
        [6, 0],
        [6, 3],
        [3, 3],
        [3, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });

    it('should handle very small polygons', () => {
      const zone1 = turf.polygon([[
        [0, 0],
        [0.0001, 0],
        [0.0001, 0.0001],
        [0, 0.0001],
        [0, 0]
      ]]);

      const zone2 = turf.polygon([[
        [0.0001, 0],
        [0.0002, 0],
        [0.0002, 0.0001],
        [0.0001, 0.0001],
        [0.0001, 0]
      ]]);

      expect(detectAdjacency(zone1, zone2)).toBe(true);
    });
  });
});