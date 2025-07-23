import { describe, it, expect } from '@jest/globals';
import { UnionFind } from './unionFind';

describe('UnionFind', () => {
  describe('initialization', () => {
    it('should create a union-find structure with n elements', () => {
      const uf = new UnionFind(5);
      
      // Each element should be its own parent initially
      for (let i = 0; i < 5; i++) {
        expect(uf.find(i)).toBe(i);
      }
    });

    it('should handle empty structure', () => {
      const uf = new UnionFind(0);
      // Should not throw
      expect(uf).toBeDefined();
    });
  });

  describe('find operation', () => {
    it('should return the element itself when not united', () => {
      const uf = new UnionFind(3);
      
      expect(uf.find(0)).toBe(0);
      expect(uf.find(1)).toBe(1);
      expect(uf.find(2)).toBe(2);
    });

    it('should apply path compression', () => {
      const uf = new UnionFind(5);
      
      // Create a chain: 0 -> 1 -> 2
      uf.union(0, 1);
      uf.union(1, 2);
      
      // Before path compression, 0's root is found through 1
      const root = uf.find(0);
      
      // After find(0), 0 should point directly to root (path compression)
      expect(uf.find(0)).toBe(root);
      // Second find should be faster (already compressed)
      expect(uf.find(0)).toBe(root);
    });
  });

  describe('union operation', () => {
    it('should unite two elements', () => {
      const uf = new UnionFind(4);
      
      uf.union(0, 1);
      
      // Both elements should have the same root
      expect(uf.find(0)).toBe(uf.find(1));
      // Other elements should remain separate
      expect(uf.find(2)).toBe(2);
      expect(uf.find(3)).toBe(3);
    });

    it('should handle union of already connected elements', () => {
      const uf = new UnionFind(3);
      
      uf.union(0, 1);
      const root1 = uf.find(0);
      
      // Union again should not change anything
      uf.union(0, 1);
      expect(uf.find(0)).toBe(root1);
      expect(uf.find(1)).toBe(root1);
    });

    it('should create transitive connections', () => {
      const uf = new UnionFind(5);
      
      uf.union(0, 1);
      uf.union(1, 2);
      uf.union(3, 4);
      
      // 0, 1, 2 should be connected
      const root012 = uf.find(0);
      expect(uf.find(1)).toBe(root012);
      expect(uf.find(2)).toBe(root012);
      
      // 3, 4 should be connected separately
      const root34 = uf.find(3);
      expect(uf.find(4)).toBe(root34);
      expect(root012).not.toBe(root34);
    });

    it('should use union by rank for efficiency', () => {
      const uf = new UnionFind(6);
      
      // Create two trees of different sizes
      uf.union(0, 1);
      uf.union(1, 2); // Tree 1: 0-1-2
      
      uf.union(3, 4);
      uf.union(4, 5); // Tree 2: 3-4-5
      
      // Union should attach smaller tree to larger (or equal rank)
      uf.union(0, 3);
      
      // All should be connected
      const root = uf.find(0);
      for (let i = 1; i < 6; i++) {
        expect(uf.find(i)).toBe(root);
      }
    });
  });

  describe('connected operation', () => {
    it('should check if two elements are connected', () => {
      const uf = new UnionFind(4);
      
      expect(uf.connected(0, 1)).toBe(false);
      
      uf.union(0, 1);
      expect(uf.connected(0, 1)).toBe(true);
      expect(uf.connected(1, 0)).toBe(true); // Symmetric
      
      expect(uf.connected(0, 2)).toBe(false);
      expect(uf.connected(2, 3)).toBe(false);
    });

    it('should handle transitive connections', () => {
      const uf = new UnionFind(5);
      
      uf.union(0, 1);
      uf.union(1, 2);
      uf.union(2, 3);
      
      // All should be connected transitively
      expect(uf.connected(0, 3)).toBe(true);
      expect(uf.connected(1, 3)).toBe(true);
      
      // 4 is not connected
      expect(uf.connected(0, 4)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle self-union', () => {
      const uf = new UnionFind(3);
      
      uf.union(1, 1);
      expect(uf.find(1)).toBe(1);
    });

    it('should handle out of bounds gracefully', () => {
      const uf = new UnionFind(3);
      
      expect(() => uf.find(-1)).toThrow();
      expect(() => uf.find(3)).toThrow();
      expect(() => uf.union(-1, 0)).toThrow();
      expect(() => uf.union(0, 5)).toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const n = 10000;
      const uf = new UnionFind(n);
      
      const start = performance.now();
      
      // Create a worst-case scenario: long chain
      for (let i = 0; i < n - 1; i++) {
        uf.union(i, i + 1);
      }
      
      // Path compression should make this fast
      for (let i = 0; i < n; i++) {
        uf.find(i);
      }
      
      const duration = performance.now() - start;
      
      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      
      // All elements should be connected
      const root = uf.find(0);
      expect(uf.find(n - 1)).toBe(root);
    });
  });
});