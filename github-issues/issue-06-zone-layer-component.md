# Issue #6: Create ZoneLayer Component Using React-Leaflet

**Labels**: component, core, leaflet, high-priority

## Description

Create the ZoneLayer component that renders geographic zones as interactive GeoJSON layers using react-leaflet, with support for hover states, selection visualization, and performance optimization for large datasets.

## Acceptance Criteria

- [ ] Renders zones as GeoJSON polygons
- [ ] Visual states: default, hover, selected
- [ ] Click events trigger zone selection
- [ ] Hover events show zone information
- [ ] Performance optimized for 1000+ zones
- [ ] Smooth transitions between states
- [ ] Custom styling per zone
- [ ] Accessibility support

## Technical Implementation

### Component Interface
```typescript
// src/components/ZoneLayer/types.ts
export interface ZoneLayerProps {
  zones: Zone[];
  selectedZoneIds: string[];
  hoveredZoneId?: string | null;
  
  // Styling
  defaultStyle?: L.PathOptions;
  hoverStyle?: L.PathOptions;
  selectedStyle?: L.PathOptions;
  getZoneStyle?: (zone: Zone, state: ZoneState) => L.PathOptions;
  
  // Behavior
  interactive?: boolean;
  smoothTransitions?: boolean;
  virtualizationThreshold?: number;
  
  // Events
  onZoneClick?: (zone: Zone, event: L.LeafletMouseEvent) => void;
  onZoneHover?: (zone: Zone | null, event?: L.LeafletMouseEvent) => void;
  onZoneDoubleClick?: (zone: Zone, event: L.LeafletMouseEvent) => void;
  
  // Performance
  simplifyTolerance?: number;
  updateOnlyVisibleZones?: boolean;
}

export type ZoneState = 'default' | 'hover' | 'selected' | 'selected-hover';

export interface Zone {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties?: Record<string, any>;
  bbox?: [number, number, number, number]; // For performance
}
```

### Main Component
```tsx
// src/components/ZoneLayer/ZoneLayer.tsx
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Feature, FeatureCollection } from 'geojson';
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
    if (!feature?.properties?.id) return defaultStyle;
    
    const zone = zones.find(z => z.id === feature.properties.id);
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
          (layer as any).setStyle(computedStyle);
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
    if (layer instanceof L.Path) {
      layer.getElement()?.setAttribute('role', 'button');
      layer.getElement()?.setAttribute('aria-label', `Zone: ${zone.name}`);
      layer.getElement()?.setAttribute('aria-pressed', selectedSet.has(zoneId).toString());
    }
  }, [zones, interactive, selectedSet, onZoneClick, onZoneHover, onZoneDoubleClick]);

  // Clean up layer references
  useEffect(() => {
    return () => {
      layerRefs.current.clear();
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
```

### Performance Optimization Hook
```typescript
// src/hooks/useVirtualization.ts
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

interface VirtualizationOptions<T> {
  items: T[];
  enabled: boolean;
  getBounds: () => L.LatLngBounds;
  getItemBounds: (item: T) => [number, number, number, number] | undefined;
  buffer?: number; // Percentage of viewport to buffer
}

export function useVirtualization<T>({
  items,
  enabled,
  getBounds,
  getItemBounds,
  buffer = 0.2
}: VirtualizationOptions<T>): T[] | null {
  const [visibleItems, setVisibleItems] = useState<T[] | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setVisibleItems(null);
      return;
    }

    const updateVisibleItems = () => {
      const bounds = getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();
      
      // Add buffer
      const latBuffer = (north - south) * buffer;
      const lngBuffer = (east - west) * buffer;
      
      const bufferedBounds = {
        north: north + latBuffer,
        south: south - latBuffer,
        east: east + lngBuffer,
        west: west - lngBuffer
      };
      
      const visible = items.filter(item => {
        const bbox = getItemBounds(item);
        if (!bbox) return true; // Include items without bounds
        
        const [minLng, minLat, maxLng, maxLat] = bbox;
        
        // Check if bbox intersects with buffered viewport
        return !(
          maxLat < bufferedBounds.south ||
          minLat > bufferedBounds.north ||
          maxLng < bufferedBounds.west ||
          minLng > bufferedBounds.east
        );
      });
      
      setVisibleItems(visible);
    };

    // Debounce updates
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    frameRef.current = requestAnimationFrame(updateVisibleItems);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [items, enabled, getBounds, getItemBounds, buffer]);

  return visibleItems;
}
```

## Testing Requirements

- [ ] Zones render correctly as GeoJSON
- [ ] Click events trigger selection
- [ ] Hover states update visually
- [ ] Selected states persist correctly
- [ ] Performance acceptable with 1000+ zones
- [ ] Virtualization activates at threshold
- [ ] Accessibility attributes present
- [ ] Custom styles apply correctly

### Test Examples
```typescript
describe('ZoneLayer', () => {
  const mockZones = [
    createMockZone('zone-1', [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]),
    createMockZone('zone-2', [[1, 0], [1, 1], [2, 1], [2, 0], [1, 0]])
  ];

  it('should render zones as GeoJSON layers', () => {
    render(
      <MapContainer>
        <ZoneLayer zones={mockZones} selectedZoneIds={[]} />
      </MapContainer>
    );
    
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByLabelText('Zone: Zone 1')).toBeInTheDocument();
  });

  it('should apply selected styles', () => {
    const { rerender } = render(
      <MapContainer>
        <ZoneLayer 
          zones={mockZones} 
          selectedZoneIds={['zone-1']}
          selectedStyle={{ fillColor: '#ff0000' }}
        />
      </MapContainer>
    );
    
    const zone1 = screen.getByLabelText('Zone: Zone 1');
    expect(zone1).toHaveAttribute('aria-pressed', 'true');
    expect(zone1).toHaveStyle({ fill: '#ff0000' });
  });
});
```

## Performance Metrics

- Initial render: < 100ms for 100 zones
- Hover response: < 16ms (60fps)
- Click response: < 50ms
- Pan/zoom with 1000 zones: > 30fps
- Memory usage: < 50MB for 1000 zones

## Related Issues

- #4: LeafletZoneSelector main component
- #17: GeoJSON rendering optimization
- #18: Hover and selection visual states
- #19: useZoneSelection hook
- #22: Adjacent zone detection