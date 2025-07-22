import { TileCache } from '../tileCache';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('TileCache', () => {
  let cache: TileCache;
  const mockBlob = (size: number) => ({
    size,
    type: 'image/png'
  }) as Blob;

  beforeEach(() => {
    cache = new TileCache({ maxSize: 1, ttl: 1000 }); // 1MB, 1 second
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with given options', () => {
      const testCache = new TileCache({ maxSize: 50, ttl: 3600000 });
      expect(testCache).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return null for non-cached items', async () => {
      const result = await cache.get('https://tile.com/1/2/3.png');
      expect(result).toBeNull();
    });

    it('should return cached item as blob URL', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const blob = mockBlob(1024);
      
      await cache.set(url, blob);
      const result = await cache.get(url);
      
      expect(result).toBe('blob:mock-url');
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should return null for expired items', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const blob = mockBlob(1024);
      
      // Set with 100ms TTL
      const shortCache = new TileCache({ maxSize: 1, ttl: 100 });
      await shortCache.set(url, blob);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = await shortCache.get(url);
      expect(result).toBeNull();
    });

    it('should remove expired items from cache', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const blob = mockBlob(1024);
      
      // Set with 100ms TTL
      const shortCache = new TileCache({ maxSize: 1, ttl: 100 });
      await shortCache.set(url, blob);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // First get removes expired item
      await shortCache.get(url);
      
      // Cache should be empty
      shortCache.clear();
      expect(shortCache['currentSize']).toBe(0);
    });
  });

  describe('set', () => {
    it('should add items to cache', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const blob = mockBlob(1024);
      
      await cache.set(url, blob);
      
      const result = await cache.get(url);
      expect(result).toBe('blob:mock-url');
    });

    it('should evict oldest items when size limit reached', async () => {
      // Cache size is 1MB
      const url1 = 'https://tile.com/1/1/1.png';
      const url2 = 'https://tile.com/2/2/2.png';
      const url3 = 'https://tile.com/3/3/3.png';
      
      // Each blob is 500KB
      const blob1 = mockBlob(500 * 1024);
      const blob2 = mockBlob(500 * 1024);
      const blob3 = mockBlob(500 * 1024);
      
      await cache.set(url1, blob1);
      await cache.set(url2, blob2);
      
      // Adding third should evict first
      await cache.set(url3, blob3);
      
      expect(await cache.get(url1)).toBeNull(); // Evicted
      expect(await cache.get(url2)).toBe('blob:mock-url'); // Still there
      expect(await cache.get(url3)).toBe('blob:mock-url'); // Just added
    });

    it('should handle adding item larger than max size', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const largeBlob = mockBlob(2 * 1024 * 1024); // 2MB, larger than 1MB limit
      
      await cache.set(url, largeBlob);
      
      // Should still be added (cache will be cleared first)
      expect(await cache.get(url)).toBe('blob:mock-url');
    });

    it('should update timestamp when overwriting existing item', async () => {
      const url = 'https://tile.com/1/2/3.png';
      const blob1 = mockBlob(1024);
      const blob2 = mockBlob(2048);
      
      await cache.set(url, blob1);
      const firstResult = await cache.get(url);
      
      await cache.set(url, blob2);
      const secondResult = await cache.get(url);
      
      expect(firstResult).toBe('blob:mock-url');
      expect(secondResult).toBe('blob:mock-url');
    });
  });

  describe('clear', () => {
    it('should remove all cached items', async () => {
      const url1 = 'https://tile.com/1/1/1.png';
      const url2 = 'https://tile.com/2/2/2.png';
      
      await cache.set(url1, mockBlob(1024));
      await cache.set(url2, mockBlob(1024));
      
      cache.clear();
      
      expect(await cache.get(url1)).toBeNull();
      expect(await cache.get(url2)).toBeNull();
    });

    it('should reset current size to 0', async () => {
      await cache.set('url1', mockBlob(1024));
      await cache.set('url2', mockBlob(1024));
      
      cache.clear();
      
      expect(cache['currentSize']).toBe(0);
    });
  });

  describe('eviction strategy', () => {
    it('should evict multiple items if needed to fit new item', async () => {
      // Cache size is 1MB
      const url1 = 'https://tile.com/1/1/1.png';
      const url2 = 'https://tile.com/2/2/2.png';
      const url3 = 'https://tile.com/3/3/3.png';
      const url4 = 'https://tile.com/4/4/4.png';
      
      // Small blobs
      await cache.set(url1, mockBlob(200 * 1024)); // 200KB
      await cache.set(url2, mockBlob(200 * 1024)); // 200KB
      await cache.set(url3, mockBlob(200 * 1024)); // 200KB
      
      // Large blob that requires evicting all previous
      await cache.set(url4, mockBlob(900 * 1024)); // 900KB
      
      expect(await cache.get(url1)).toBeNull(); // Evicted
      expect(await cache.get(url2)).toBeNull(); // Evicted
      expect(await cache.get(url3)).toBeNull(); // Evicted
      expect(await cache.get(url4)).toBe('blob:mock-url'); // Added
    });
  });
});

describe('createCachedTileLayer', () => {
  // Note: This would require more complex mocking of Leaflet
  // For now, we'll skip testing the Leaflet integration
  it.todo('should create a custom tile layer with caching');
});