import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import { useVirtualization } from '@/hooks/useVirtualization';
import { simplifyGeometry } from '@/utils/geoUtils';
import type { ZoneLayerProps, ZoneState } from './types';

const DEFAULT_STYLES = {
  default: {
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    color: '#3b82f6',
    weight: 2,
    opacity: 0.5
  },
  hover: {
    fillOpacity: 0.2,
    weight: 3,
    opacity: 0.7
  },
  selected: {
    fillColor: '#1d4ed8',
    fillOpacity: 0.3,
    color: '#1d4ed8',
    weight: 3,
    opacity: 0.8
  }
};

export const ZoneLayer: React.FC<ZoneLayerProps> = ({
  zones,
  selectedZoneIds,
  hoveredZoneId,
  defaultStyle = DEFAULT_STYLES.default,
  hoverStyle = DEFAULT_STYLES.hover,
  selectedStyle = DEFAULT_STYLES.selected,
  getZoneStyle,
  interactive = true,
  smoothTransitions = true,
  virtualizationThreshold = 500,
  onZoneClick,
  onZoneHover,
  onZoneDoubleClick,
  simplifyTolerance = 0.001,
  updateOnlyVisibleZones = true
}) => {
  const map = useMap();
  const layerRefs = useRef<Map<string, L.GeoJSON>>(new Map());
  const selectedSet = useMemo(() => new Set(selectedZoneIds), [selectedZoneIds]);

  // Convert zones to GeoJSON FeatureCollection
  const featureCollection = useMemo((): FeatureCollection => {
    const features = zones.map(zone => ({
      type: 'Feature' as const,
      properties: {
        ...zone.properties,
        id: zone.id,
        name: zone.name
      },
      geometry: simplifyTolerance > 0 
        ? simplifyGeometry(zone.geometry, simplifyTolerance)
        : zone.geometry,
      bbox: zone.bbox
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }, [zones, simplifyTolerance]);

  // Use virtualization for large datasets
  const visibleZones = useVirtualization({
    items: zones,
    enabled: zones.length > virtualizationThreshold,
    getBounds: () => map.getBounds(),
    getItemBounds: (zone) => zone.bbox
  });

  // Determine zone state
  const getZoneState = useCallback((zoneId: string): ZoneState => {
    const isSelected = selectedSet.has(zoneId);
    const isHovered = zoneId === hoveredZoneId;
    
    if (isSelected && isHovered) return 'selected-hover';
    if (isSelected) return 'selected';
    if (isHovered) return 'hover';
    return 'default';
  }, [selectedSet, hoveredZoneId]);

  // Style function for each feature
  const style = useCallback((feature?: Feature) => {
    if (!feature || !feature.properties?.id) return defaultStyle;
    
    const zone = zones.find(z => z.id === feature.properties!.id);
    if (!zone) return defaultStyle;
    
    const state = getZoneState(zone.id);
    
    // Custom style function takes precedence
    if (getZoneStyle) {
      return getZoneStyle(zone, state);
    }
    
    // Merge styles based on state
    let computedStyle = { ...defaultStyle };
    
    if (state.includes('hover')) {
      computedStyle = { ...computedStyle, ...hoverStyle };
    }
    
    if (state.includes('selected')) {
      computedStyle = { ...computedStyle, ...selectedStyle };
    }
    
    // Add transitions for smooth state changes
    if (smoothTransitions && feature.properties._layer) {
      const layer = layerRefs.current.get(feature.properties.id);
      if (layer) {
        requestAnimationFrame(() => {
          if ('setStyle' in layer && typeof layer.setStyle === 'function') {
            layer.setStyle(computedStyle);
          }
        });
      }
    }
    
    return computedStyle;
  }, [zones, defaultStyle, hoverStyle, selectedStyle, getZoneStyle, getZoneState, smoothTransitions]);

  // Event handlers
  const onEachFeature = useCallback((feature: Feature, layer: L.Layer) => {
    const zoneId = feature.properties?.id;
    if (!zoneId) return;
    
    // Store layer reference
    layerRefs.current.set(zoneId, layer as L.GeoJSON);
    
    // Find zone data
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    // Set up event handlers
    if (interactive) {
      layer.on({
        click: (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onZoneClick?.(zone, e);
        },
        mouseover: (e: L.LeafletMouseEvent) => {
          onZoneHover?.(zone, e);
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          onZoneHover?.(null, e);
        },
        dblclick: (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onZoneDoubleClick?.(zone, e);
        }
      });
    }
    
    // Accessibility
    try {
      const element = 'getElement' in layer && typeof layer.getElement === 'function' ? layer.getElement() : null;
      if (element) {
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Zone: ${zone.name}`);
        element.setAttribute('aria-pressed', selectedSet.has(zoneId).toString());
      }
    } catch (error) {
      // Handle cases where getElement is not available (e.g., during testing)
      console.debug('Unable to set accessibility attributes:', error);
    }
  }, [zones, interactive, selectedSet, onZoneClick, onZoneHover, onZoneDoubleClick]);

  // Clean up layer references
  useEffect(() => {
    const refs = layerRefs.current;
    return () => {
      refs.clear();
    };
  }, []);

  // Update only visible zones when map moves
  useEffect(() => {
    if (!updateOnlyVisibleZones || zones.length <= virtualizationThreshold) return;
    
    const handleMoveEnd = () => {
      // Force re-render of visible zones
      // Implementation depends on virtualization hook
    };
    
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, updateOnlyVisibleZones, zones.length, virtualizationThreshold]);

  // Render virtualized or all zones
  const zonesToRender = zones.length > virtualizationThreshold && visibleZones
    ? visibleZones
    : zones;

  const renderedFeatures = useMemo(() => {
    if (zonesToRender === zones) return featureCollection;
    
    const visibleIds = new Set(zonesToRender.map(z => z.id));
    return {
      ...featureCollection,
      features: featureCollection.features.filter(f => 
        visibleIds.has(f.properties?.id)
      )
    };
  }, [zonesToRender, zones, featureCollection]);

  return (
    <GeoJSON
      key={`zone-layer-${zones.length}`} // Force re-render on zone changes
      data={renderedFeatures}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
};