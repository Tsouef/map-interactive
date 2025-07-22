import { SpatialIndex } from '../spatialIndex';
import * as turf from '@turf/turf';

describe('SpatialIndex', () => {
  describe('basic functionality', () => {
    it('should index single feature', () => {
      const index = new SpatialIndex({ gridSize: 5 });
      const feature = turf.polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]);

      index.addFeatures([feature]);
      
      expect(index.getFeatures()).toHaveLength(1);
      expect(index.getPotentialNeighbors(0)).toEqual([]);
    });

    it('should find potential neighbors for adjacent features', () => {
      const index = new SpatialIndex({ gridSize: 5 });
      const features = [
        turf.polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]),
        turf.polygon([[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]]),
        turf.polygon([[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]]) // Far away
      ];

      index.addFeatures(features);
      
      const neighbors0 = index.getPotentialNeighbors(0);
      const neighbors1 = index.getPotentialNeighbors(1);
      const neighbors2 = index.getPotentialNeighbors(2);
      
      expect(neighbors0).toContain(1);
      expect(neighbors0).not.toContain(2);
      expect(neighbors1).toContain(0);
      expect(neighbors2).toEqual([]);
    });

    it('should handle features spanning multiple grid cells', () => {
      const index = new SpatialIndex({ gridSize: 3 });
      const largeFeature = turf.polygon([[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0]
      ]]);
      const smallFeature = turf.polygon([[
        [5, 5],
        [6, 5],
        [6, 6],
        [5, 6],
        [5, 5]
      ]]);

      index.addFeatures([largeFeature, smallFeature]);
      
      const neighbors0 = index.getPotentialNeighbors(0);
      const neighbors1 = index.getPotentialNeighbors(1);
      
      expect(neighbors0).toContain(1);
      expect(neighbors1).toContain(0);
    });
  });

  describe('grid size optimization', () => {
    it('should handle different grid sizes', () => {
      const features = Array.from({ length: 25 }, (_, i) => {
        const x = i % 5;
        const y = Math.floor(i / 5);
        return turf.polygon([[
          [x, y],
          [x + 0.9, y],
          [x + 0.9, y + 0.9],
          [x, y + 0.9],
          [x, y]
        ]]);
      });

      // Test with different grid sizes
      const gridSizes = [2, 5, 10, 20];
      
      gridSizes.forEach(gridSize => {
        const index = new SpatialIndex({ gridSize });
        index.addFeatures(features);
        
        // Corner feature should have 3 neighbors
        const cornerNeighbors = index.getPotentialNeighbors(0);
        expect(cornerNeighbors.length).toBeGreaterThanOrEqual(3);
        
        // Center feature should have 8 neighbors
        const centerNeighbors = index.getPotentialNeighbors(12); // Center of 5x5 grid
        expect(centerNeighbors.length).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty feature set', () => {
      const index = new SpatialIndex();
      index.addFeatures([]);
      
      expect(index.getFeatures()).toEqual([]);
      expect(index.getPotentialNeighbors(0)).toEqual([]);
    });

    it('should handle features at boundary', () => {
      const index = new SpatialIndex({ gridSize: 3 });
      const features = [
        turf.polygon([[[-180, -90], [-179, -90], [-179, -89], [-180, -89], [-180, -90]]]),
        turf.polygon([[[179, 89], [180, 89], [180, 90], [179, 90], [179, 89]]])
      ];

      index.addFeatures(features);
      
      expect(index.getFeatures()).toHaveLength(2);
    });

    it('should handle multi-polygons', () => {
      const index = new SpatialIndex({ gridSize: 5 });
      const multiPolygon = turf.multiPolygon([
        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]]
      ]);
      const polygon = turf.polygon([[
        [0.5, 1.5],
        [1.5, 1.5],
        [1.5, 2.5],
        [0.5, 2.5],
        [0.5, 1.5]
      ]]);

      index.addFeatures([multiPolygon, polygon]);
      
      const neighbors = index.getPotentialNeighbors(0);
      expect(neighbors).toContain(1);
    });
  });

  describe('performance', () => {
    it('should efficiently handle large numbers of features', () => {
      const index = new SpatialIndex({ gridSize: 20 });
      const features = Array.from({ length: 1000 }, (_, i) => {
        const x = (i % 50) * 2;
        const y = Math.floor(i / 50) * 2;
        return turf.polygon([[
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1],
          [x, y]
        ]]);
      });

      const startTime = performance.now();
      index.addFeatures(features);
      const indexTime = performance.now() - startTime;

      // Indexing should be fast
      expect(indexTime).toBeLessThan(100);

      // Neighbor queries should be fast
      const queryStart = performance.now();
      const neighbors = index.getPotentialNeighbors(500);
      const queryTime = performance.now() - queryStart;

      expect(queryTime).toBeLessThan(10);
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors.length).toBeLessThan(100); // Should not return all features
    });
  });
});