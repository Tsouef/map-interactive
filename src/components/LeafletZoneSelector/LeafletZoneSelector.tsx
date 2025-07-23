import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useZoneSelection } from '@/hooks/useZoneSelection';
import { SearchInput } from '../SearchInput';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorBoundary } from '../ErrorBoundary';
import { exportToFormat } from '@/utils/exportFormats';
import { calculateMetrics } from '@/utils/metrics';
import type { Zone } from '@/types';
import type { LeafletZoneSelectorProps, LeafletZoneSelectorRef } from './types';
import 'leaflet/dist/leaflet.css';
import './LeafletZoneSelector.css';

// Type definitions for Leaflet extensions
interface LeafletIconDefault {
  _getIconUrl?: string;
}

interface LeafletContainer extends HTMLElement {
  _leaflet_id?: number;
}

interface LeafletWithMaps {
  _maps?: Record<number, L.Map>;
}

// Fix Leaflet default icon issue
delete ((L.Icon.Default.prototype as unknown) as LeafletIconDefault)._getIconUrl;

// Handle different environments (Vite vs Jest)
if (typeof import.meta !== 'undefined' && import.meta.url) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  });
} else {
  // Fallback for Jest environment
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/dist/images/marker-icon-2x.png',
    iconUrl: '/leaflet/dist/images/marker-icon.png',
    shadowUrl: '/leaflet/dist/images/marker-shadow.png',
  });
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
  children
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
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

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Clean up any existing map
    const leafletContainer = container as LeafletContainer;
    if (leafletContainer._leaflet_id) {
      try {
        const leafletLib = L as typeof L & LeafletWithMaps;
        const existingMap = leafletLib._maps?.[leafletContainer._leaflet_id];
        if (existingMap) {
          existingMap.remove();
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Create map
    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom,
      maxZoom,
      keyboard: enableKeyboardNavigation
    });

    if (bounds) {
      map.fitBounds(bounds);
    }

    // Add tile layer
    const tileUrl = getTileUrl();
    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      detectRetina,
      errorTileUrl: getFallbackTileUrl(),
    }).addTo(map);

    // Create zones layer group
    const zonesLayer = L.layerGroup().addTo(map);
    
    mapRef.current = map;
    zonesLayerRef.current = zonesLayer;
    
    onMapReady?.(map);

    // Cleanup
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
          zonesLayerRef.current = null;
        } catch {
          // Ignore cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once

  // Update zones on map
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current || !zones) return;

    // Clear existing zones
    zonesLayerRef.current.clearLayers();

    // Add new zones
    zones.forEach(zone => {
      if (zone.geometry && zone.geometry.type === 'Polygon') {
        const isSelected = selectedZones.some(z => z.id === zone.id);
        const isHovered = hoveredZone?.id === zone.id;
        
        // Convert GeoJSON coordinates to Leaflet format [lat, lng]
        const coordinates = zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]);
        
        const polygon = L.polygon(coordinates, {
          color: isSelected ? '#2196F3' : '#666',
          weight: isSelected ? 3 : 2,
          opacity: isHovered ? 1 : 0.8,
          fillColor: isSelected ? '#2196F3' : '#999',
          fillOpacity: isHovered ? 0.6 : (isSelected ? 0.4 : 0.2),
        });

        polygon.on('click', (e) => {
          if (isZoneSelected(zone.id)) {
            deselectZone(zone.id);
          } else {
            selectZone(zone);
          }
          onZoneClick?.(zone, e);
        });

        polygon.on('mouseover', () => {
          setHoveredZone(zone);
          onZoneHover?.(zone);
        });

        polygon.on('mouseout', () => {
          setHoveredZone(null);
          onZoneHover?.(null);
        });

        polygon.addTo(zonesLayerRef.current!);
      }
    });
  }, [zones, selectedZones, hoveredZone, selectZone, deselectZone, isZoneSelected, setHoveredZone, onZoneClick, onZoneHover]);

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

  const getThemeClass = () => {
    if (typeof theme === 'string') {
      return theme;
    }
    return 'custom';
  };

  const getTileUrl = () => {
    const providers: Record<string, string> = {
      openstreetmap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      cartoDB: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      cartoDBDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      stamen: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png'
    };
    
    const providerName = tileProvider || (theme === 'dark' ? 'cartoDBDark' : theme === 'light' ? 'cartoDB' : 'openstreetmap');
    const providerKey = typeof providerName === 'string' ? providerName : 'openstreetmap';
    return providers[providerKey] || providers.openstreetmap;
  };

  const getFallbackTileUrl = () => {
    const providers: Record<string, string> = {
      openstreetmap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      cartoDB: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      cartoDBDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    };
    
    return providers[fallbackTileProvider] || providers.openstreetmap;
  };

  const content = (
    <div 
      className={`leaflet-zone-selector ${getThemeClass()} ${containerClassName || ''}`}
      style={containerStyle}
      role="application"
    >
      <div 
        ref={containerRef}
        className="leaflet-zone-selector__map"
        style={{ width: '100%', height: '100%' }}
      />
      
      {enableSearch && mapRef.current && (
        <SearchInput
          onLocationSelect={(location) => {
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);
            mapRef.current?.setView([lat, lon], 14);
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