import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TILE_PROVIDERS, TileProvider } from '../../config/tileProviders';

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