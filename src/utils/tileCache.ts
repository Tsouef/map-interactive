import L from 'leaflet';

interface TileCacheOptions {
  maxSize: number; // Maximum cache size in MB
  ttl: number; // Time to live in milliseconds
}

export class TileCache {
  private cache: Map<string, { data: Blob; timestamp: number }>;
  private maxSize: number;
  private ttl: number;
  private currentSize: number = 0;

  constructor(options: TileCacheOptions) {
    this.cache = new Map();
    this.maxSize = options.maxSize * 1024 * 1024; // Convert to bytes
    this.ttl = options.ttl;
  }

  async get(url: string): Promise<string | null> {
    const cached = this.cache.get(url);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(url);
      this.currentSize -= cached.data.size;
      return null;
    }
    
    return URL.createObjectURL(cached.data);
  }

  async set(url: string, blob: Blob): Promise<void> {
    // If updating existing entry, subtract its old size first
    const existing = this.cache.get(url);
    if (existing) {
      this.currentSize -= existing.data.size;
    }
    
    // Evict old entries if necessary
    while (this.currentSize + blob.size > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      const oldestEntry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.currentSize -= oldestEntry.data.size;
    }
    
    this.cache.set(url, { data: blob, timestamp: Date.now() });
    this.currentSize += blob.size;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}

// Custom tile layer with caching
export const createCachedTileLayer = (
  url: string, 
  options?: L.TileLayerOptions
): L.TileLayer => {
  const cache = new TileCache({ maxSize: 50, ttl: 24 * 60 * 60 * 1000 }); // 50MB, 24h
  
  const CachedTileLayer = L.TileLayer.extend({
    createTile: function(coords: L.Coords, done: L.DoneCallback) {
      const tile = document.createElement('img') as HTMLImageElement;
      const tileUrl = this.getTileUrl(coords);
      
      cache.get(tileUrl).then(cachedUrl => {
        if (cachedUrl) {
          tile.src = cachedUrl;
          done(null, tile);
        } else {
          fetch(tileUrl)
            .then(res => res.blob())
            .then(blob => {
              cache.set(tileUrl, blob);
              tile.src = URL.createObjectURL(blob);
              done(null, tile);
            })
            .catch(err => done(err, tile));
        }
      }).catch(err => done(err, tile));
      
      return tile;
    }
  });
  
  return new CachedTileLayer(url, options);
};