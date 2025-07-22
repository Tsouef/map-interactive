import { mergeAdjacentZones } from '../mergeAdjacentZones';
import type { Zone } from '../../types';

describe('mergeAdjacentZones - Performance Benchmarks', () => {
  const createGridZones = (rows: number, cols: number): Zone[] => {
    const zones: Zone[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        zones.push({
          id: `zone-${i}-${j}`,
          name: `Zone ${i}-${j}`,
          coordinates: [[
            [j, i],
            [j + 1, i],
            [j + 1, i + 1],
            [j, i + 1],
            [j, i]
          ]],
          properties: {
            row: i,
            col: j
          }
        });
      }
    }
    return zones;
  };

  const createSparseZones = (count: number, spacing: number): Zone[] => {
    const zones: Zone[] = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = col * spacing;
      const y = row * spacing;
      
      zones.push({
        id: `zone-${i}`,
        name: `Zone ${i}`,
        coordinates: [[
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1],
          [x, y]
        ]],
        properties: {
          index: i
        }
      });
    }
    return zones;
  };

  const createComplexZones = (count: number): Zone[] => {
    const zones: Zone[] = [];
    
    for (let i = 0; i < count; i++) {
      const centerX = i * 1.8;
      const centerY = Math.sin(i * 0.5) * 2;
      const vertices = 20 + (i % 10) * 5; // Vary complexity
      
      const coords: [number, number][] = [];
      for (let v = 0; v < vertices; v++) {
        const angle = (v / vertices) * 2 * Math.PI;
        const radius = 1 + 0.3 * Math.sin(angle * 4);
        coords.push([
          centerX + radius * Math.cos(angle),
          centerY + radius * Math.sin(angle)
        ]);
      }
      coords.push(coords[0]);
      
      zones.push({
        id: `complex-${i}`,
        name: `Complex Zone ${i}`,
        coordinates: [coords],
        properties: {
          vertices: vertices
        }
      });
    }
    return zones;
  };

  describe('Grid Performance', () => {
    it.each([
      [5, 5, 100],
      [10, 10, 500],
      [15, 15, 1000],
      [20, 20, 2000]
    ])('should merge %dx%d grid efficiently (under %dms)', (rows, cols, maxTime) => {
      const zones = createGridZones(rows, cols);
      
      const startTime = performance.now();
      const result = mergeAdjacentZones(zones);
      const endTime = performance.now();
      
      expect(result).toHaveLength(1); // All zones should merge into one
      expect(result[0].properties.mergedZones).toHaveLength(rows * cols);
      expect(endTime - startTime).toBeLessThan(maxTime);
    });
  });

  describe('Sparse Zones Performance', () => {
    it.each([
      [50, 3, 500],
      [100, 3, 1000],
      [200, 3, 2000]
    ])('should handle %d sparse zones efficiently (under %dms)', (count, spacing, maxTime) => {
      const zones = createSparseZones(count, spacing);
      
      const startTime = performance.now();
      const result = mergeAdjacentZones(zones);
      const endTime = performance.now();
      
      expect(result).toHaveLength(count); // No zones should merge (too far apart)
      expect(endTime - startTime).toBeLessThan(maxTime);
    });
  });

  describe('Complex Geometry Performance', () => {
    it.each([
      [10, 200],
      [25, 500],
      [50, 1500]
    ])('should merge %d complex zones efficiently (under %dms)', (count, maxTime) => {
      const zones = createComplexZones(count);
      
      const startTime = performance.now();
      const result = mergeAdjacentZones(zones);
      const endTime = performance.now();
      
      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(maxTime);
    });
  });

  describe('Mixed Scenarios', () => {
    it('should handle mixed adjacent and non-adjacent zones', () => {
      // Create several clusters of adjacent zones
      const cluster1 = createGridZones(5, 5);
      const cluster2 = createGridZones(3, 3).map(z => ({
        ...z,
        id: `cluster2-${z.id}`,
        coordinates: z.coordinates.map(ring => 
          ring.map(([x, y]) => [x + 10, y + 10] as [number, number])
        ) as Zone['coordinates']
      }));
      const cluster3 = createGridZones(4, 4).map(z => ({
        ...z,
        id: `cluster3-${z.id}`,
        coordinates: z.coordinates.map(ring => 
          ring.map(([x, y]) => [x + 20, y] as [number, number])
        ) as Zone['coordinates']
      }));
      
      const allZones = [...cluster1, ...cluster2, ...cluster3];
      
      const startTime = performance.now();
      const result = mergeAdjacentZones(allZones);
      const endTime = performance.now();
      
      expect(result).toHaveLength(3); // Three separate clusters
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not consume excessive memory for large datasets', () => {
      const zones = createGridZones(30, 30); // 900 zones
      
      // Get initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const result = mergeAdjacentZones(zones);
      
      // Get final memory usage
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      expect(result).toHaveLength(1);
      
      // Memory increase should be reasonable (less than 50MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
        expect(memoryIncrease).toBeLessThan(50);
      }
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle zones with many holes efficiently', () => {
      const zonesWithHoles: Zone[] = [];
      
      for (let i = 0; i < 10; i++) {
        const outerRing: [number, number][] = [
          [i * 5, 0],
          [i * 5 + 4, 0],
          [i * 5 + 4, 4],
          [i * 5, 4],
          [i * 5, 0]
        ];
        
        const holes: [number, number][][] = [];
        // Add 5 holes
        for (let h = 0; h < 5; h++) {
          const hx = i * 5 + 0.5 + h * 0.7;
          const hy = 0.5 + h * 0.7;
          holes.push([
            [hx, hy],
            [hx + 0.5, hy],
            [hx + 0.5, hy + 0.5],
            [hx, hy + 0.5],
            [hx, hy]
          ]);
        }
        
        zonesWithHoles.push({
          id: `zone-holes-${i}`,
          name: `Zone with Holes ${i}`,
          coordinates: [outerRing, ...holes],
          properties: {}
        });
      }
      
      const startTime = performance.now();
      const result = mergeAdjacentZones(zonesWithHoles);
      const endTime = performance.now();
      
      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});