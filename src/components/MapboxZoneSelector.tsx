import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap, MapMouseEvent, GeoJSONSource } from 'mapbox-gl';
import { useZoneSelection } from '../hooks/useZoneSelection';
import type { 
  MapboxZoneSelectorProps, 
  MapboxZoneSelectorRef, 
  Zone, 
  ThemeObject,
  MapboxEvent,
  Coordinates
} from '../types';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxZoneSelector.css';

// Default values
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566]; // Paris
const DEFAULT_ZOOM = 10;
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

// Default colors for zones
const DEFAULT_COLORS = {
  normal: '#3b82f6',
  hover: '#60a5fa',
  selected: '#1d4ed8',
  border: '#1e40af',
  borderHover: '#1e3a8a',
  borderSelected: '#1e293b'
};

export const MapboxZoneSelector = React.memo(forwardRef<
  MapboxZoneSelectorRef,
  MapboxZoneSelectorProps
>(({
  mapboxToken,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  mapStyle = DEFAULT_MAP_STYLE,
  multiSelect = true,
  maxSelections,
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
  const [error, setError] = useState<Error | null>(null);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const hoveredZoneIdRef = useRef<string | null>(null);
  
  // Use zone selection hook
  const {
    selectedZones,
    selectedZoneIds,
    selectZone,
    clearSelection,
    setHoveredZone
  } = useZoneSelection({
    multiSelect,
    maxSelections,
    onSelectionChange: useCallback((zones: Zone[]) => {
      const coordinates = zones.map(z => z.coordinates);
      onSelectionChange?.(zones, coordinates);
    }, [onSelectionChange])
  });
  
  // Convert dimensions to strings if numeric
  const heightStr = typeof height === 'number' ? `${height}px` : height;
  const widthStr = typeof width === 'number' ? `${width}px` : width;
  
  // Handle errors
  const handleError = useCallback((error: Error) => {
    setError(error);
    onError?.(error);
  }, [onError]);
  
  // Get theme colors
  const getThemeColors = useCallback(() => {
    if (typeof theme === 'object') {
      return {
        normal: theme.colors.primary,
        hover: theme.colors.hover,
        selected: theme.colors.selected,
        border: theme.colors.border,
        borderHover: theme.colors.hover,
        borderSelected: theme.colors.selected
      };
    }
    return DEFAULT_COLORS;
  }, [theme]);
  
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
        
        // Add zones source
        mapInstance.addSource('zones', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add zones fill layer
        const colors = getThemeColors();
        
        mapInstance.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              colors.selected,
              ['boolean', ['feature-state', 'hover'], false],
              colors.hover,
              colors.normal
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              0.7,
              ['boolean', ['feature-state', 'hover'], false],
              0.5,
              0.3
            ]
          }
        });
        
        // Add zones line layer
        mapInstance.addLayer({
          id: 'zones-line',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              colors.borderSelected,
              ['boolean', ['feature-state', 'hover'], false],
              colors.borderHover,
              colors.border
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3,
              ['boolean', ['feature-state', 'hover'], false],
              2,
              1
            ]
          }
        });
        
        setZonesLoaded(true);
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
  }, [mapboxToken, mapStyle, initialCenter, initialZoom, onMapLoad, handleError, getThemeColors]);
  
  // Handle zone click
  const handleZoneClick = useCallback((e: MapMouseEvent) => {
    if (!map || !zonesLoaded) return;
    
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['zones-fill']
    });
    
    if (features.length > 0) {
      const feature = features[0];
      const zone: Zone = {
        id: feature.properties?.id || `zone-${Date.now()}`,
        name: feature.properties?.name || 'Unknown Zone',
        coordinates: feature.geometry.type === 'Polygon' ? 
          feature.geometry.coordinates as Coordinates[][] : 
          [[[e.lngLat.lng, e.lngLat.lat]]],
        properties: {
          ...feature.properties,
          postalCode: feature.properties?.postalCode
        }
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
      selectZone(zone);
    }
  }, [map, zonesLoaded, selectZone, onZoneClick]);
  
  // Handle zone hover
  const handleZoneHover = useCallback((e: MapMouseEvent) => {
    if (!map || !zonesLoaded) return;
    
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['zones-fill']
    });
    
    if (features.length > 0) {
      const feature = features[0];
      const zoneId = feature.properties?.id;
      
      if (zoneId && hoveredZoneIdRef.current !== zoneId) {
        // Remove previous hover state
        if (hoveredZoneIdRef.current) {
          map.removeFeatureState(
            { source: 'zones', id: hoveredZoneIdRef.current }
          );
        }
        
        // Set new hover state
        map.setFeatureState(
          { source: 'zones', id: zoneId },
          { hover: true }
        );
        
        hoveredZoneIdRef.current = zoneId;
        
        // Update hover state in hook
        const zone: Zone = {
          id: zoneId,
          name: feature.properties?.name || 'Unknown Zone',
          coordinates: feature.geometry.type === 'Polygon' ? 
            feature.geometry.coordinates as Coordinates[][] : 
            [],
          properties: feature.properties || {}
        };
        setHoveredZone(zone);
      }
      
      map.getCanvas().style.cursor = 'pointer';
    } else {
      // Clear hover state
      if (hoveredZoneIdRef.current) {
        map.removeFeatureState(
          { source: 'zones', id: hoveredZoneIdRef.current }
        );
        hoveredZoneIdRef.current = null;
        setHoveredZone(null);
      }
      map.getCanvas().style.cursor = '';
    }
  }, [map, zonesLoaded, setHoveredZone]);
  
  // Update zone selection states
  useEffect(() => {
    if (!map || !zonesLoaded) return;
    
    // Update feature states for selected zones
    const source = map.getSource('zones') as GeoJSONSource;
    if (!source) return;
    
    // Clear all selected states first
    // Note: In a real implementation, you'd track all zone IDs
    // For now, we'll update the paint property expressions
    
    // Update paint properties to reflect selection
    map.setPaintProperty('zones-fill', 'fill-color', [
      'case',
      ['in', ['get', 'id'], ['literal', Array.from(selectedZoneIds)]],
      getThemeColors().selected,
      ['boolean', ['feature-state', 'hover'], false],
      getThemeColors().hover,
      getThemeColors().normal
    ]);
    
    map.setPaintProperty('zones-fill', 'fill-opacity', [
      'case',
      ['in', ['get', 'id'], ['literal', Array.from(selectedZoneIds)]],
      0.7,
      ['boolean', ['feature-state', 'hover'], false],
      0.5,
      0.3
    ]);
    
    map.setPaintProperty('zones-line', 'line-color', [
      'case',
      ['in', ['get', 'id'], ['literal', Array.from(selectedZoneIds)]],
      getThemeColors().borderSelected,
      ['boolean', ['feature-state', 'hover'], false],
      getThemeColors().borderHover,
      getThemeColors().border
    ]);
    
    map.setPaintProperty('zones-line', 'line-width', [
      'case',
      ['in', ['get', 'id'], ['literal', Array.from(selectedZoneIds)]],
      3,
      ['boolean', ['feature-state', 'hover'], false],
      2,
      1
    ]);
    
  }, [map, zonesLoaded, selectedZoneIds, getThemeColors]);
  
  // Set up event handlers
  useEffect(() => {
    if (!map || !zonesLoaded) return;
    
    const handleMouseLeave = () => {
      if (hoveredZoneIdRef.current) {
        map.removeFeatureState(
          { source: 'zones', id: hoveredZoneIdRef.current }
        );
        hoveredZoneIdRef.current = null;
        setHoveredZone(null);
      }
      map.getCanvas().style.cursor = '';
    };
    
    // Click handler
    map.on('click', 'zones-fill', handleZoneClick);
    
    // Hover handlers
    map.on('mouseenter', 'zones-fill', handleZoneHover);
    map.on('mousemove', 'zones-fill', handleZoneHover);
    map.on('mouseleave', 'zones-fill', handleMouseLeave);
    
    return () => {
      map.off('click', 'zones-fill', handleZoneClick);
      map.off('mouseenter', 'zones-fill', handleZoneHover);
      map.off('mousemove', 'zones-fill', handleZoneHover);
      map.off('mouseleave', 'zones-fill', handleMouseLeave);
    };
  }, [map, zonesLoaded, handleZoneClick, handleZoneHover, setHoveredZone]);
  
  // Handle window resize
  useEffect(() => {
    if (!map) return;
    
    const handleResize = () => {
      map.resize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  
  // Imperative methods
  const selectZoneById = useCallback((zoneId: string) => {
    // In a real implementation, you'd look up the zone from your data source
    const zone: Zone = {
      id: zoneId,
      name: `Zone ${zoneId}`,
      coordinates: [[[0, 0]]], // Mock coordinates
      properties: {},
    };
    
    selectZone(zone);
  }, [selectZone]);
  
  const getSelectedZonesMethod = useCallback((): Zone[] => {
    return selectedZones;
  }, [selectedZones]);
  
  const exportSelection = useCallback((format: 'geojson' | 'kml' | 'csv') => {
    const zones = selectedZones;
    
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
  }, [selectedZones]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getMap: () => map,
    selectZone: selectZoneById,
    clearSelection,
    getSelectedZones: getSelectedZonesMethod,
    exportSelection,
  }), [map, selectZoneById, clearSelection, getSelectedZonesMethod, exportSelection]);
  
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
        const features = map.queryRenderedFeatures(point, {
          layers: ['zones-fill']
        });
        
        if (features.length > 0) {
          handleZoneClick({
            lngLat: center,
            point,
            originalEvent: new MouseEvent('click'),
            target: map,
            type: 'click',
          } as MapMouseEvent);
        }
        break;
      }
    }
  }, [map, handleZoneClick]);
  
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