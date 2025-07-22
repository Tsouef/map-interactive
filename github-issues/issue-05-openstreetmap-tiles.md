# Issue #5: Implement OpenStreetMap Tile Layer Integration

**Labels**: map, tiles, openstreetmap, high-priority

## Description

Implement OpenStreetMap (OSM) tile layer integration with multiple tile providers, proper attribution, and fallback options for reliability.

## Acceptance Criteria

- [ ] Default OSM tiles load correctly
- [ ] Multiple tile provider options available
- [ ] Proper attribution displayed
- [ ] Retina/high-DPI display support
- [ ] Offline fallback handling
- [ ] Custom tile server support
- [ ] Tile loading events exposed

## Technical Implementation

### Tile Provider Configuration
```typescript
// src/config/tileProviders.ts
export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  detectRetina?: boolean;
}

export const TILE_PROVIDERS: Record<string, TileProvider> = {
  openstreetmap: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  
  cartoDB: {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  cartoDBDark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  stamen: {
    name: 'Stamen Toner',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  custom: {
    name: 'Custom',
    url: '', // User-provided
    attribution: '', // User-provided
    maxZoom: 18
  }
};

export const getDefaultProvider = (theme: 'light' | 'dark'): TileProvider => {
  return theme === 'dark' ? TILE_PROVIDERS.cartoDBDark : TILE_PROVIDERS.cartoDB;
};
```

### Enhanced Tile Layer Component
```tsx
// src/components/TileLayer/EnhancedTileLayer.tsx
import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { TILE_PROVIDERS, TileProvider } from '@/config/tileProviders';

export interface EnhancedTileLayerProps {
  provider?: keyof typeof TILE_PROVIDERS | TileProvider;
  fallbackProvider?: keyof typeof TILE_PROVIDERS;
  detectRetina?: boolean;
  crossOrigin?: boolean;
  onTileLoadStart?: () => void;
  onTileLoad?: () => void;
  onTileError?: (error: Error) => void;
}

export const EnhancedTileLayer: React.FC<EnhancedTileLayerProps> = ({
  provider = 'openstreetmap',
  fallbackProvider = 'openstreetmap',
  detectRetina = true,
  crossOrigin = false,
  onTileLoadStart,
  onTileLoad,
  onTileError
}) => {
  const map = useMap();
  const [currentProvider, setCurrentProvider] = useState<TileProvider>(
    typeof provider === 'string' ? TILE_PROVIDERS[provider] : provider
  );
  const [loadingTiles, setLoadingTiles] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Handle tile loading events
  useEffect(() => {
    const handleTileLoadStart = () => {
      setLoadingTiles(prev => prev + 1);
      onTileLoadStart?.();
    };

    const handleTileLoad = () => {
      setLoadingTiles(prev => Math.max(0, prev - 1));
      onTileLoad?.();
    };

    const handleTileError = (e: L.TileErrorEvent) => {
      setLoadingTiles(prev => Math.max(0, prev - 1));
      setHasError(true);
      onTileError?.(new Error(`Tile load failed: ${e.tile.src}`));
      
      // Switch to fallback provider if available
      if (fallbackProvider && !hasError) {
        setCurrentProvider(TILE_PROVIDERS[fallbackProvider]);
      }
    };

    map.on('tileloadstart', handleTileLoadStart);
    map.on('tileload', handleTileLoad);
    map.on('tileerror', handleTileError);

    return () => {
      map.off('tileloadstart', handleTileLoadStart);
      map.off('tileload', handleTileLoad);
      map.off('tileerror', handleTileError);
    };
  }, [map, fallbackProvider, hasError, onTileLoadStart, onTileLoad, onTileError]);

  // Build tile URL with retina support
  const tileUrl = currentProvider.detectRetina && detectRetina
    ? currentProvider.url.replace('{r}', '@2x')
    : currentProvider.url.replace('{r}', '');

  return (
    <>
      <TileLayer
        url={tileUrl}
        attribution={currentProvider.attribution}
        maxZoom={currentProvider.maxZoom}
        subdomains={currentProvider.subdomains}
        crossOrigin={crossOrigin}
        errorTileUrl="/images/tile-error.png" // Fallback tile image
      />
      {loadingTiles > 0 && (
        <div className="tile-loading-indicator">
          Loading map tiles... ({loadingTiles})
        </div>
      )}
    </>
  );
};
```

### Tile Caching Strategy
```typescript
// src/utils/tileCache.ts
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
export const createCachedTileLayer = (options: L.TileLayerOptions) => {
  const cache = new TileCache({ maxSize: 50, ttl: 24 * 60 * 60 * 1000 }); // 50MB, 24h
  
  return L.tileLayer.extend({
    createTile: function(coords: L.Coords, done: L.DoneCallback) {
      const tile = document.createElement('img');
      const url = this.getTileUrl(coords);
      
      cache.get(url).then(cachedUrl => {
        if (cachedUrl) {
          tile.src = cachedUrl;
          done(null, tile);
        } else {
          fetch(url)
            .then(res => res.blob())
            .then(blob => {
              cache.set(url, blob);
              tile.src = URL.createObjectURL(blob);
              done(null, tile);
            })
            .catch(err => done(err));
        }
      });
      
      return tile;
    }
  });
};
```

### Usage in Main Component
```tsx
// Example usage in LeafletZoneSelector
<MapContainer {...mapProps}>
  <EnhancedTileLayer
    provider={theme === 'dark' ? 'cartoDBDark' : 'cartoDB'}
    fallbackProvider="openstreetmap"
    onTileError={(error) => {
      console.error('Tile loading error:', error);
      // Could show user notification
    }}
  />
  {/* Other layers */}
</MapContainer>
```

## Testing Requirements

- [ ] Tiles load successfully from primary provider
- [ ] Fallback to secondary provider on error
- [ ] Attribution displays correctly
- [ ] Retina tiles load on high-DPI screens
- [ ] Tile loading indicators work
- [ ] Custom tile server configuration works
- [ ] Offline handling doesn't crash app

### Test Examples
```typescript
describe('EnhancedTileLayer', () => {
  it('should load tiles from specified provider', () => {
    render(
      <MapContainer>
        <EnhancedTileLayer provider="cartoDB" />
      </MapContainer>
    );
    
    const tileLayer = screen.getByRole('img', { name: /tile/i });
    expect(tileLayer).toHaveAttribute('src', expect.stringContaining('cartocdn.com'));
  });

  it('should fall back to alternative provider on error', async () => {
    const onTileError = jest.fn();
    
    render(
      <MapContainer>
        <EnhancedTileLayer
          provider="custom"
          fallbackProvider="openstreetmap"
          onTileError={onTileError}
        />
      </MapContainer>
    );
    
    // Simulate tile error
    fireEvent.error(screen.getByRole('img'));
    
    await waitFor(() => {
      expect(onTileError).toHaveBeenCalled();
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        expect.stringContaining('openstreetmap.org')
      );
    });
  });
});
```

## Performance Optimization

- Implement tile preloading for adjacent areas
- Use service workers for offline caching
- Optimize tile size for mobile devices
- Implement progressive loading for better UX
- Monitor and report tile loading metrics

## Legal Considerations

- Respect OSM tile usage policy
- Include proper attribution
- Consider rate limiting for high-traffic apps
- Document tile provider terms of service
- Provide option for self-hosted tiles

## Related Issues

- #4: LeafletZoneSelector main component
- #27: Loading states and error boundaries
- #29: Theme provider with CSS variables