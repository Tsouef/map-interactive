import * as turf from '@turf/turf';
import {
  calculateArea,
  calculatePerimeter,
  getCentroid,
  getBoundingBox,
  isPointInZone,
  calculateDistance,
  transformCoordinates,
  validateGeoJSON,
  normalizeGeoJSON
} from '../geoUtils';
import type { Zone } from '../../types/zone';
import type { Coordinates } from '../../types/geography';

describe('geoUtils', () => {
  // Test data - a simple square zone
  const mockSquareZone: Zone = {
    id: 'square-zone',
    name: 'Test Square Zone',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]
    }
  };

  // Test data - Paris 1er Arrondissement (simplified)
  const mockParis1erZone: Zone = {
    id: 'paris-1',
    name: 'Paris 1er Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.320, 48.860],
        [2.350, 48.860],
        [2.350, 48.870],
        [2.320, 48.870],
        [2.320, 48.860]
      ]]
    }
  };

  // Test data - MultiPolygon zone
  const mockMultiPolygonZone: Zone = {
    id: 'multi-zone',
    name: 'Multi Zone',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]]
      ]
    }
  };

  describe('calculateArea', () => {
    it('should calculate area in square kilometers for a polygon', () => {
      const area = calculateArea(mockSquareZone);
      // The square is approximately 111km x 111km at the equator
      expect(area).toBeGreaterThan(12000); // > 12,000 km²
      expect(area).toBeLessThan(13000); // < 13,000 km²
    });

    it('should calculate area for a multipolygon', () => {
      const area = calculateArea(mockMultiPolygonZone);
      expect(area).toBeGreaterThan(24000); // Two squares
      expect(area).toBeLessThan(26000);
    });

    it('should calculate area for Paris 1er', () => {
      const area = calculateArea(mockParis1erZone);
      // Paris 1er is approximately 1.8 km²
      expect(area).toBeGreaterThan(1.5);
      expect(area).toBeLessThan(2.5);
    });

    it('should throw error for invalid zone', () => {
      const invalidZone = { ...mockSquareZone, geometry: null } as any;
      expect(() => calculateArea(invalidZone)).toThrow();
    });
  });

  describe('calculatePerimeter', () => {
    it('should calculate perimeter in kilometers for a polygon', () => {
      const perimeter = calculatePerimeter(mockSquareZone);
      // Each side is approximately 111km at the equator
      expect(perimeter).toBeGreaterThan(440); // > 440 km
      expect(perimeter).toBeLessThan(450); // < 450 km
    });

    it('should calculate perimeter for a multipolygon', () => {
      const perimeter = calculatePerimeter(mockMultiPolygonZone);
      expect(perimeter).toBeGreaterThan(880); // Two squares
      expect(perimeter).toBeLessThan(900);
    });

    it('should calculate perimeter for Paris 1er', () => {
      const perimeter = calculatePerimeter(mockParis1erZone);
      // Approximate perimeter
      expect(perimeter).toBeGreaterThan(5);
      expect(perimeter).toBeLessThan(10);
    });
  });

  describe('getCentroid', () => {
    it('should calculate centroid for a polygon', () => {
      const centroid = getCentroid(mockSquareZone);
      expect(centroid).toEqual([0.5, 0.5]);
    });

    it('should calculate centroid for a multipolygon', () => {
      const centroid = getCentroid(mockMultiPolygonZone);
      expect(centroid[0]).toBeGreaterThan(1);
      expect(centroid[0]).toBeLessThan(2);
      expect(centroid[1]).toBeGreaterThan(1);
      expect(centroid[1]).toBeLessThan(2);
    });

    it('should calculate centroid for Paris 1er', () => {
      const centroid = getCentroid(mockParis1erZone);
      expect(centroid[0]).toBeCloseTo(2.335, 2);
      expect(centroid[1]).toBeCloseTo(48.865, 2);
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box for a polygon', () => {
      const bbox = getBoundingBox(mockSquareZone);
      expect(bbox).toEqual([0, 0, 1, 1]);
    });

    it('should calculate bounding box for a multipolygon', () => {
      const bbox = getBoundingBox(mockMultiPolygonZone);
      expect(bbox).toEqual([0, 0, 3, 3]);
    });

    it('should calculate bounding box for Paris 1er', () => {
      const bbox = getBoundingBox(mockParis1erZone);
      expect(bbox).toEqual([2.320, 48.860, 2.350, 48.870]);
    });
  });

  describe('isPointInZone', () => {
    it('should return true for point inside polygon', () => {
      const point: Coordinates = [0.5, 0.5];
      expect(isPointInZone(point, mockSquareZone)).toBe(true);
    });

    it('should return false for point outside polygon', () => {
      const point: Coordinates = [2, 2];
      expect(isPointInZone(point, mockSquareZone)).toBe(false);
    });

    it('should handle point on polygon boundary', () => {
      const point: Coordinates = [0, 0];
      expect(isPointInZone(point, mockSquareZone)).toBe(true);
    });

    it('should work with multipolygon', () => {
      const point1: Coordinates = [0.5, 0.5];
      const point2: Coordinates = [2.5, 2.5];
      const point3: Coordinates = [1.5, 1.5];
      
      expect(isPointInZone(point1, mockMultiPolygonZone)).toBe(true);
      expect(isPointInZone(point2, mockMultiPolygonZone)).toBe(true);
      expect(isPointInZone(point3, mockMultiPolygonZone)).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two zones', () => {
      const zone1 = mockSquareZone;
      const zone2: Zone = {
        ...mockSquareZone,
        id: 'zone2',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [10, 10],
            [11, 10],
            [11, 11],
            [10, 11],
            [10, 10]
          ]]
        }
      };

      const distance = calculateDistance(zone1, zone2);
      // Distance should be roughly sqrt(2) * 10 * 111km
      expect(distance).toBeGreaterThan(1500);
      expect(distance).toBeLessThan(1600);
    });

    it('should return 0 for overlapping zones', () => {
      const zone1 = mockSquareZone;
      const zone2: Zone = {
        ...mockSquareZone,
        id: 'zone2',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0.5, 0.5],
            [1.5, 0.5],
            [1.5, 1.5],
            [0.5, 1.5],
            [0.5, 0.5]
          ]]
        }
      };

      const distance = calculateDistance(zone1, zone2);
      expect(distance).toBe(0);
    });
  });

  describe('transformCoordinates', () => {
    it('should swap coordinates from [lat, lng] to [lng, lat]', () => {
      const coords: [number, number] = [48.865, 2.335];
      const transformed = transformCoordinates(coords, 'swap');
      expect(transformed).toEqual([2.335, 48.865]);
    });

    it('should handle array of coordinates', () => {
      const coords: Array<[number, number]> = [[48.865, 2.335], [48.870, 2.340]];
      const transformed = transformCoordinates(coords, 'swap');
      expect(transformed).toEqual([[2.335, 48.865], [2.340, 48.870]]);
    });
  });

  describe('validateGeoJSON', () => {
    it('should validate valid polygon GeoJSON', () => {
      const valid = validateGeoJSON(mockSquareZone.geometry);
      expect(valid).toBe(true);
    });

    it('should validate valid multipolygon GeoJSON', () => {
      const valid = validateGeoJSON(mockMultiPolygonZone.geometry);
      expect(valid).toBe(true);
    });

    it('should reject invalid GeoJSON', () => {
      const invalid = {
        type: 'Polygon',
        coordinates: [[0, 0], [1, 1]] // Not enough points
      };
      expect(validateGeoJSON(invalid)).toBe(false);
    });

    it('should reject non-polygon geometries', () => {
      const point = {
        type: 'Point',
        coordinates: [0, 0]
      };
      expect(validateGeoJSON(point)).toBe(false);
    });
  });

  describe('normalizeGeoJSON', () => {
    it('should close unclosed polygons', () => {
      const unclosed = {
        type: 'Polygon' as const,
        coordinates: [[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
          // Missing closing coordinate
        ]]
      };

      const normalized = normalizeGeoJSON(unclosed);
      expect(normalized.coordinates[0]).toHaveLength(5);
      expect(normalized.coordinates[0][4]).toEqual([0, 0]);
    });

    it('should fix winding order', () => {
      const clockwise = {
        type: 'Polygon' as const,
        coordinates: [[
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]]
      };

      const normalized = normalizeGeoJSON(clockwise);
      // Should be counter-clockwise
      expect(normalized.coordinates[0]).toEqual([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]);
    });

    it('should handle multipolygons', () => {
      const multipolygon = {
        type: 'MultiPolygon' as const,
        coordinates: [
          [[[0, 0], [0, 1], [1, 1], [1, 0]]], // Unclosed
          [[[2, 2], [2, 3], [3, 3], [3, 2], [2, 2]]] // Closed
        ]
      };

      const normalized = normalizeGeoJSON(multipolygon);
      expect(normalized.coordinates[0][0]).toHaveLength(5);
      expect(normalized.coordinates[1][0]).toHaveLength(5);
    });
  });
});