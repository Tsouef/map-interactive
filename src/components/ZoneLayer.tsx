import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Map as MapboxMap, GeoJSONSource, MapMouseEvent } from 'mapbox-gl';
import * as turf from '@turf/turf';
import type { Zone } from '../types';

export interface ZoneLayerStyles {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  selectedFillColor?: string;
  selectedFillOpacity?: number;
  selectedStrokeColor?: string;
  selectedStrokeWidth?: number;
  hoverFillOpacity?: number;
  hoverStrokeWidth?: number;
}

export interface ZoneLayerProps {
  map: MapboxMap | null;
  zones: Zone[];
  selectedZoneIds: string[];
  hoveredZoneId: string | null;
  onZoneClick?: (zoneId: string, event: MapMouseEvent) => void;
  onZoneHover?: (zoneId: string | null) => void;
  styles?: ZoneLayerStyles;
  simplifyTolerance?: number;
  enableVirtualization?: boolean;
  viewportBuffer?: number;
}

const DEFAULT_STYLES: Required<ZoneLayerStyles> = {
  fillColor: '#3b82f6',
  fillOpacity: 0.2,
  strokeColor: '#1e40af',
  strokeWidth: 1,
  selectedFillColor: '#1d4ed8',
  selectedFillOpacity: 0.4,
  selectedStrokeColor: '#1e293b',
  selectedStrokeWidth: 2,
  hoverFillOpacity: 0.3,
  hoverStrokeWidth: 2,
};

const SOURCE_ID = 'zones';
const FILL_LAYER_ID = 'zones-fill';
const BORDER_LAYER_ID = 'zones-border';

export const ZoneLayer: React.FC<ZoneLayerProps> = ({
  map,
  zones,
  selectedZoneIds,
  hoveredZoneId,
  onZoneClick,
  onZoneHover,
  styles = {},
  simplifyTolerance = 0,
  enableVirtualization = false,
  viewportBuffer = 0.1,
}) => {
  const mergedStyles = { ...DEFAULT_STYLES, ...styles };
  const previousHoveredId = useRef<string | null>(null);
  const selectedSet = useMemo(() => new Set(selectedZoneIds), [selectedZoneIds]);
  const visibleZonesRef = useRef<Zone[]>(zones);

  // Convert zones to GeoJSON FeatureCollection
  const geoJsonData = useMemo(() => {
    const zonesToRender = enableVirtualization ? visibleZonesRef.current : zones;
    
    const features = zonesToRender.map(zone => {
      // Detect if it's MultiPolygon or Polygon
      const isMultiPolygon = zone.coordinates.length > 0 && 
        Array.isArray(zone.coordinates[0]) && 
        Array.isArray(zone.coordinates[0][0]) &&
        Array.isArray(zone.coordinates[0][0][0]);

      const geometry = isMultiPolygon
        ? { type: 'MultiPolygon' as const, coordinates: zone.coordinates as number[][][][] }
        : { type: 'Polygon' as const, coordinates: zone.coordinates as number[][][] };

      // Simplify polygon if needed
      let finalGeometry = geometry;
      if (simplifyTolerance > 0) {
        try {
          const feature = turf.feature(geometry);
          const simplified = turf.simplify(feature, { tolerance: simplifyTolerance });
          finalGeometry = simplified.geometry as typeof geometry;
        } catch (error) {
          // If simplification fails, use original geometry
          console.warn(`Failed to simplify zone ${zone.id}:`, error);
        }
      }

      return {
        type: 'Feature' as const,
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          ...zone.properties,
        },
        geometry: finalGeometry,
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [zones, simplifyTolerance, enableVirtualization]);

  // Update visible zones based on viewport
  const updateVisibleZones = useCallback(() => {
    if (!map || !enableVirtualization) return;

    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Add buffer to bounds
    const latBuffer = (ne.lat - sw.lat) * viewportBuffer;
    const lngBuffer = (ne.lng - sw.lng) * viewportBuffer;

    const expandedBounds = [
      sw.lng - lngBuffer,
      sw.lat - latBuffer,
      ne.lng + lngBuffer,
      ne.lat + latBuffer,
    ];

    // Filter zones within expanded bounds
    visibleZonesRef.current = zones.filter(zone => {
      // Simple bounds check - could be optimized with spatial index
      const coords = zone.coordinates[0] as number[][];
      return coords.some(coord => {
        const [lng, lat] = coord;
        return lng >= expandedBounds[0] && lng <= expandedBounds[2] &&
               lat >= expandedBounds[1] && lat <= expandedBounds[3];
      });
    });

    // Update the source data
    const source = map.getSource(SOURCE_ID) as GeoJSONSource;
    if (source) {
      source.setData(geoJsonData);
    }
  }, [map, zones, enableVirtualization, viewportBuffer, geoJsonData]);

  // Initialize layers
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Add source
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geoJsonData,
      });
    }

    // Add fill layer
    if (!map.getLayer(FILL_LAYER_ID)) {
      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            mergedStyles.selectedFillColor,
            mergedStyles.fillColor,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            mergedStyles.hoverFillOpacity,
            ['boolean', ['feature-state', 'selected'], false],
            mergedStyles.selectedFillOpacity,
            mergedStyles.fillOpacity,
          ],
        },
      });
    }

    // Add border layer
    if (!map.getLayer(BORDER_LAYER_ID)) {
      map.addLayer({
        id: BORDER_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            mergedStyles.selectedStrokeColor,
            mergedStyles.strokeColor,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            mergedStyles.hoverStrokeWidth,
            ['boolean', ['feature-state', 'selected'], false],
            mergedStyles.selectedStrokeWidth,
            mergedStyles.strokeWidth,
          ],
        },
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.getLayer(FILL_LAYER_ID)) {
        map.removeLayer(FILL_LAYER_ID);
      }
      if (map.getLayer(BORDER_LAYER_ID)) {
        map.removeLayer(BORDER_LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
    };
  }, [map, geoJsonData, mergedStyles]);

  // Update source data when zones change
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(SOURCE_ID) as GeoJSONSource;
    if (source) {
      source.setData(geoJsonData);
    }
  }, [map, geoJsonData]);

  // Handle click events
  useEffect(() => {
    if (!map || !onZoneClick) return;

    const handleClick = (e: MapMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        const zoneId = features[0].properties?.id;
        if (zoneId) {
          onZoneClick(zoneId, e);
        }
      }
    };

    map.on('click', FILL_LAYER_ID, handleClick);
    return () => {
      map.off('click', FILL_LAYER_ID, handleClick);
    };
  }, [map, onZoneClick]);

  // Handle hover events
  useEffect(() => {
    if (!map || !onZoneHover) return;

    const handleMouseEnter = (e: MapMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        const zoneId = features[0].properties?.id;
        if (zoneId) {
          map.getCanvas().style.cursor = 'pointer';
          onZoneHover(zoneId);
        }
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      onZoneHover(null);
    };

    map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter);
    map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);

    return () => {
      map.off('mouseenter', FILL_LAYER_ID, handleMouseEnter);
      map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
    };
  }, [map, onZoneHover]);

  // Update hover state
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Remove previous hover state
    if (previousHoveredId.current && previousHoveredId.current !== hoveredZoneId) {
      map.removeFeatureState(
        { source: SOURCE_ID, id: previousHoveredId.current },
        'hover'
      );
    }

    // Add new hover state
    if (hoveredZoneId) {
      map.setFeatureState(
        { source: SOURCE_ID, id: hoveredZoneId },
        { hover: true }
      );
    }

    previousHoveredId.current = hoveredZoneId;
  }, [map, hoveredZoneId]);

  // Update selected states
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Clear all selected states first
    zones.forEach(zone => {
      map.removeFeatureState(
        { source: SOURCE_ID, id: zone.id },
        'selected'
      );
    });

    // Set selected states
    selectedZoneIds.forEach(id => {
      map.setFeatureState(
        { source: SOURCE_ID, id },
        { selected: true }
      );
    });
  }, [map, zones, selectedZoneIds]);

  // Handle viewport changes for virtualization
  useEffect(() => {
    if (!map || !enableVirtualization) return;

    updateVisibleZones();
    map.on('moveend', updateVisibleZones);

    return () => {
      map.off('moveend', updateVisibleZones);
    };
  }, [map, enableVirtualization, updateVisibleZones]);

  return null; // This component doesn't render any DOM elements
};