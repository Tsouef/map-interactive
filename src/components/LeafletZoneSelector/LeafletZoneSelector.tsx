import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import type { Map } from 'leaflet';
import { useZoneSelection } from '@/hooks/useZoneSelection';
import { EnhancedTileLayer } from '../TileLayer';
import { ZoneLayer } from '../ZoneLayer';
import { SearchInput } from '../SearchInput';
import { DrawingTools } from '../DrawingTools';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorBoundary } from '../ErrorBoundary';
import { exportToFormat } from '@/utils/exportFormats';
import { calculateMetrics } from '@/utils/metrics';
import type { Zone } from '@/types';
import type { LeafletZoneSelectorProps, LeafletZoneSelectorRef } from './types';
import 'leaflet/dist/leaflet.css';
import './LeafletZoneSelector.css';

// Helper component to access map instance
function MapRefHandler({ onMapReady }: { onMapReady: (map: Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
}

export const LeafletZoneSelector = forwardRef<
  LeafletZoneSelectorRef,
  LeafletZoneSelectorProps
>(({
  initialCenter = [48.8566, 2.3522], // Paris
  initialZoom = 12,
  minZoom = 3,
  maxZoom = 18,
  bounds,
  zones: initialZones,
  loadZonesAsync,
  multiSelect = true,
  maxSelections = Infinity,
  selectedZoneIds = [],
  enableSearch = true,
  enableDrawing = false,
  enableKeyboardNavigation = true,
  theme = 'light',
  tileProvider,
  fallbackTileProvider = 'openstreetmap',
  detectRetina = true,
  containerClassName,
  containerStyle,
  onSelectionChange,
  onZoneClick,
  onZoneHover,
  onMapReady,
  onError,
  onTileError,
  onTileLoadStart,
  onTileLoad,
  children
}, ref) => {
  const mapRef = useRef<Map | null>(null);
  const [zones, setZones] = useState<Zone[]>(initialZones || []);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<Error | null>(null);
  
  const {
    selectedZones,
    hoveredZone,
    selectZone,
    deselectZone,
    clearSelection,
    isZoneSelected,
    setHoveredZone
  } = useZoneSelection({
    initialSelection: selectedZoneIds,
    multiSelect,
    maxSelections,
    onSelectionChange,
    zones
  });

  // Load zones asynchronously
  useEffect(() => {
    if (loadZonesAsync && !initialZones) {
      setLoading(true);
      loadZonesAsync()
        .then(setZones)
        .catch((err) => {
          setError(err);
          onError?.(err);
        })
        .finally(() => setLoading(false));
    }
  }, [loadZonesAsync, initialZones, onError]);

  // Imperative API
  useImperativeHandle(ref, () => ({
    setView: (center, zoom) => {
      mapRef.current?.setView(center, zoom || mapRef.current.getZoom());
    },
    fitBounds: (bounds) => {
      mapRef.current?.fitBounds(bounds);
    },
    selectZones: (zoneIds) => {
      zoneIds.forEach(id => {
        const zone = zones.find(z => z.id === id);
        if (zone) selectZone(zone);
      });
    },
    clearSelection,
    getSelectedZones: () => selectedZones,
    loadZones: setZones,
    refreshZones: async () => {
      if (loadZonesAsync) {
        setLoading(true);
        try {
          const newZones = await loadZonesAsync();
          setZones(newZones);
        } catch (err) {
          setError(err as Error);
          onError?.(err as Error);
        } finally {
          setLoading(false);
        }
      }
    },
    exportSelection: (format) => {
      return exportToFormat(selectedZones, format);
    },
    getSelectionMetrics: () => {
      return calculateMetrics(selectedZones);
    }
  }), [zones, selectedZones, selectZone, clearSelection, loadZonesAsync, onError]);

  const handleMapReady = useCallback((map: Map) => {
    mapRef.current = map;
    onMapReady?.(map);
  }, [onMapReady]);

  const getThemeClass = () => {
    if (typeof theme === 'string') {
      return theme;
    }
    return 'custom';
  };

  const content = (
    <div 
      className={`leaflet-zone-selector ${getThemeClass()} ${containerClassName || ''}`}
      style={containerStyle}
      role="application"
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        bounds={bounds}
        className="leaflet-zone-selector__map"
        keyboard={enableKeyboardNavigation}
      >
        <MapRefHandler onMapReady={handleMapReady} />
        <EnhancedTileLayer
          provider={tileProvider || (theme === 'dark' ? 'cartoDBDark' : theme === 'light' ? 'cartoDB' : 'openstreetmap')}
          fallbackProvider={fallbackTileProvider}
          detectRetina={detectRetina}
          onTileError={onTileError}
          onTileLoadStart={onTileLoadStart}
          onTileLoad={onTileLoad}
        />
        
        {zones && zones.length > 0 && (
          <ZoneLayer
            zones={zones}
            selectedZoneIds={selectedZones.map(z => z.id)}
            hoveredZoneId={hoveredZone?.id}
            onZoneClick={(zone, event) => {
              if (isZoneSelected(zone.id)) {
                deselectZone(zone.id);
              } else {
                selectZone(zone);
              }
              onZoneClick?.(zone, event);
            }}
            onZoneHover={(zone) => {
              setHoveredZone(zone);
              onZoneHover?.(zone);
            }}
            theme={theme}
          />
        )}
        
        {enableDrawing && (
          <DrawingTools
            onShapeCreated={(shape) => {
              // Handle custom drawn shapes
              console.log('Shape created:', shape);
            }}
          />
        )}
      </MapContainer>
      
      {enableSearch && (
        <SearchInput
          onLocationFound={(location) => {
            mapRef.current?.setView(location.center, 14);
          }}
        />
      )}
      
      {loading && <LoadingOverlay />}
      
      {children}
    </div>
  );

  return (
    <ErrorBoundary onError={onError}>
      {content}
    </ErrorBoundary>
  );
});

LeafletZoneSelector.displayName = 'LeafletZoneSelector';