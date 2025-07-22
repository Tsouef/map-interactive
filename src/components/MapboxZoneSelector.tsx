import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import type { 
  MapboxZoneSelectorProps, 
  MapboxZoneSelectorRef, 
  Zone, 
  ThemeObject,
  MapboxEvent 
} from '../types';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

// Default values
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566]; // Paris
const DEFAULT_ZOOM = 10;
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

export const MapboxZoneSelector = React.memo(forwardRef<
  MapboxZoneSelectorRef,
  MapboxZoneSelectorProps
>(({
  mapboxToken,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  mapStyle = DEFAULT_MAP_STYLE,
  multiSelect = true,
  // enableDrawing = false,
  // enableSearch = true,
  onSelectionChange,
  onZoneClick,
  onMapLoad,
  onError,
  theme = 'light',
  height = '100%',
  width = '100%',
}, ref) => {
  // State
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [selectedZones, setSelectedZones] = useState<Map<string, Zone>>(new Map());
  const [error, setError] = useState<Error | null>(null);
  
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const selectedZonesRef = useRef<Map<string, Zone>>(new Map());
  
  // Convert dimensions to strings if numeric
  const heightStr = typeof height === 'number' ? `${height}px` : height;
  const widthStr = typeof width === 'number' ? `${width}px` : width;
  
  // Handle errors
  const handleError = useCallback((error: Error) => {
    setError(error);
    onError?.(error);
  }, [onError]);
  
  // Handle map click
  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (!map) return;
    
    // Create a mock zone for now
    const zone: Zone = {
      id: `zone-${Date.now()}`,
      name: `Zone at ${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}`,
      coordinates: [[[e.lngLat.lng, e.lngLat.lat]]], // Mock coordinates
      properties: {},
    };
    
    // Create event object
    const event: MapboxEvent = {
      lngLat: e.lngLat,
      point: e.point,
      originalEvent: e.originalEvent,
      target: map,
      type: e.type,
    };
    
    // Call zone click callback
    onZoneClick?.(zone, event);
    
    // Handle selection
    if (multiSelect) {
      setSelectedZones(prev => {
        const newSelection = new Map(prev);
        if (newSelection.has(zone.id)) {
          newSelection.delete(zone.id);
        } else {
          newSelection.set(zone.id, zone);
        }
        return newSelection;
      });
    } else {
      setSelectedZones(new Map([[zone.id, zone]]));
    }
  }, [map, multiSelect, onZoneClick]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Validate token
    if (!mapboxToken) {
      handleError(new Error('Invalid Mapbox token'));
      return;
    }
    
    try {
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      
      // Create map instance
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: initialCenter,
        zoom: initialZoom,
        accessToken: mapboxToken,
      });
      
      // Handle map load
      mapInstance.on('load', () => {
        setMap(mapInstance);
        onMapLoad?.(mapInstance);
      });
      
      // Store map instance
      setMap(mapInstance);
      
      // Cleanup
      return () => {
        mapInstance.remove();
      };
    } catch (err) {
      handleError(err as Error);
    }
  }, [mapboxToken, mapStyle, initialCenter, initialZoom, onMapLoad, handleError]);
  
  // Handle map click events
  useEffect(() => {
    if (!map) return;
    
    const clickHandler = (e: MapMouseEvent) => handleMapClick(e);
    map.on('click', clickHandler);
    
    return () => {
      map.off('click', clickHandler);
    };
  }, [map, handleMapClick]);
  
  // Handle window resize
  useEffect(() => {
    if (!map) return;
    
    const handleResize = () => {
      map.resize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  
  // Update selection change callback and ref
  useEffect(() => {
    selectedZonesRef.current = selectedZones;
    
    if (!onSelectionChange) return;
    
    const zones = Array.from(selectedZones.values());
    const coordinates = zones.map(z => z.coordinates);
    onSelectionChange(zones, coordinates);
  }, [selectedZones, onSelectionChange]);
  
  // Imperative methods
  const selectZone = useCallback((zoneId: string) => {
    // Create a mock zone for now
    const zone: Zone = {
      id: zoneId,
      name: `Zone ${zoneId}`,
      coordinates: [[[0, 0]]], // Mock coordinates
      properties: {},
    };
    
    if (multiSelect) {
      const newSelection = new Map(selectedZonesRef.current).set(zoneId, zone);
      selectedZonesRef.current = newSelection;
      setSelectedZones(newSelection);
    } else {
      const newSelection = new Map([[zoneId, zone]]);
      selectedZonesRef.current = newSelection;
      setSelectedZones(newSelection);
    }
  }, [multiSelect]);
  
  const clearSelection = useCallback(() => {
    selectedZonesRef.current = new Map();
    setSelectedZones(new Map());
  }, []);
  
  const getSelectedZones = useCallback((): Zone[] => {
    return Array.from(selectedZonesRef.current.values());
  }, []);
  
  const exportSelection = useCallback((format: 'geojson' | 'kml' | 'csv') => {
    const zones = Array.from(selectedZonesRef.current.values());
    
    switch (format) {
      case 'geojson':
        return JSON.stringify({
          type: 'FeatureCollection',
          features: zones.map(zone => ({
            type: 'Feature',
            properties: { id: zone.id, name: zone.name, ...zone.properties },
            geometry: {
              type: 'Polygon',
              coordinates: zone.coordinates,
            },
          })),
        });
        
      case 'kml':
        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${zones.map(zone => `
    <Placemark>
      <name>${zone.name}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${zone.coordinates[0].map(coord => coord.join(',')).join(' ')}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`).join('')}
  </Document>
</kml>`;
        
      case 'csv': {
        const headers = 'id,name,coordinates\n';
        const rows = zones.map(zone => 
          `${zone.id},${zone.name},"${JSON.stringify(zone.coordinates)}"`
        ).join('\n');
        return headers + rows;
      }
        
      default:
        return '';
    }
  }, []);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getMap: () => map,
    selectZone,
    clearSelection,
    getSelectedZones,
    exportSelection,
  }), [map, selectZone, clearSelection, getSelectedZones, exportSelection]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!map) return;
    
    switch (e.key) {
      case 'ArrowUp':
        map.panBy([0, -100]);
        break;
      case 'ArrowDown':
        map.panBy([0, 100]);
        break;
      case 'ArrowLeft':
        map.panBy([-100, 0]);
        break;
      case 'ArrowRight':
        map.panBy([100, 0]);
        break;
      case 'Enter':
      case ' ': {
        // Simulate selection at center
        const center = map.getCenter();
        const point = map.project(center);
        handleMapClick({
          lngLat: center,
          point,
          originalEvent: new MouseEvent('click'),
          target: map,
          type: 'click',
        } as MapMouseEvent);
        break;
      }
    }
  }, [map, handleMapClick]);
  
  // Apply theme styles
  const getThemeStyles = useCallback((): React.CSSProperties => {
    if (typeof theme === 'string') {
      return {};
    }
    
    const themeObj = theme as ThemeObject;
    return {
      '--mzs-primary': themeObj.colors.primary,
      '--mzs-hover': themeObj.colors.hover,
      '--mzs-selected': themeObj.colors.selected,
      '--mzs-border': themeObj.colors.border,
      '--mzs-transition': themeObj.transitions.normal,
    } as React.CSSProperties;
  }, [theme]);
  
  // Get theme class
  const getThemeClass = useCallback(() => {
    if (typeof theme === 'string') {
      return `mapbox-zone-selector--${theme}`;
    }
    return 'mapbox-zone-selector--custom';
  }, [theme]);
  
  return (
    <>
      <div
        ref={mapContainerRef}
        className={`mapbox-zone-selector ${getThemeClass()}`}
        style={{
          height: heightStr,
          width: widthStr,
          position: 'relative',
          ...getThemeStyles(),
        }}
        role="application"
        aria-label="Interactive map for zone selection"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {error && (
          <div role="alert" className="mapbox-zone-selector__error">
            {error.message}
          </div>
        )}
      </div>
      
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
    </>
  );
}));

MapboxZoneSelector.displayName = 'MapboxZoneSelector';