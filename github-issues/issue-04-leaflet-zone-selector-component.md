# Issue #4: Create LeafletZoneSelector Main Component

**Labels**: component, core, leaflet, high-priority

## Description

Create the main LeafletZoneSelector component that serves as the primary interface for the library. This component manages the Leaflet map instance, coordinates all child components, and provides the public API.

## Acceptance Criteria

- [ ] Component renders Leaflet map with OpenStreetMap tiles
- [ ] Responsive container that fills parent element
- [ ] Props for initial center, zoom, and bounds
- [ ] Ref-based API for imperative methods
- [ ] Event callbacks for selection changes
- [ ] Theme support (light/dark/custom)
- [ ] Loading and error states
- [ ] Proper cleanup on unmount

## Technical Implementation

### Component Interface
```typescript
// src/components/LeafletZoneSelector/types.ts
export interface LeafletZoneSelectorProps {
  // Map Configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [[number, number], [number, number]];
  
  // Data
  zones?: Zone[];
  loadZonesAsync?: () => Promise<Zone[]>;
  
  // Selection
  multiSelect?: boolean;
  maxSelections?: number;
  selectedZoneIds?: string[];
  
  // Behavior
  enableSearch?: boolean;
  enableDrawing?: boolean;
  enableKeyboardNavigation?: boolean;
  
  // Styling
  theme?: 'light' | 'dark' | ThemeConfig;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  
  // Callbacks
  onSelectionChange?: (zones: Zone[]) => void;
  onZoneClick?: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneHover?: (zone: Zone | null) => void;
  onMapReady?: (map: L.Map) => void;
  onError?: (error: Error) => void;
}

export interface LeafletZoneSelectorRef {
  // Map Control
  setView: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: L.LatLngBoundsExpression) => void;
  
  // Selection
  selectZones: (zoneIds: string[]) => void;
  clearSelection: () => void;
  getSelectedZones: () => Zone[];
  
  // Data
  loadZones: (zones: Zone[]) => void;
  refreshZones: () => Promise<void>;
  
  // Export
  exportSelection: (format: ExportFormat) => string | Blob;
  getSelectionMetrics: () => SelectionMetrics;
}
```

### Main Component
```tsx
// src/components/LeafletZoneSelector/LeafletZoneSelector.tsx
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useZoneSelection } from '@/hooks/useZoneSelection';
import { ZoneLayer } from '../ZoneLayer';
import { SearchInput } from '../SearchInput';
import { DrawingTools } from '../DrawingTools';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorBoundary } from '../ErrorBoundary';
import type { LeafletZoneSelectorProps, LeafletZoneSelectorRef } from './types';
import 'leaflet/dist/leaflet.css';
import './LeafletZoneSelector.css';

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
  containerClassName,
  containerStyle,
  onSelectionChange,
  onZoneClick,
  onZoneHover,
  onMapReady,
  onError
}, ref) => {
  const mapRef = useRef<L.Map>(null);
  const [zones, setZones] = useState<Zone[]>(initialZones || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    selectedZones,
    hoveredZone,
    selectZone,
    deselectZone,
    clearSelection,
    isZoneSelected
  } = useZoneSelection({
    initialSelection: selectedZoneIds,
    multiSelect,
    maxSelections,
    onSelectionChange
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
      // Implementation in export utils
      return exportToFormat(selectedZones, format);
    },
    getSelectionMetrics: () => {
      // Implementation in metrics utils
      return calculateMetrics(selectedZones);
    }
  }), [zones, selectedZones, selectZone, clearSelection, loadZonesAsync, onError]);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    onMapReady?.(map);
  };

  return (
    <ErrorBoundary onError={onError}>
      <div 
        className={`leaflet-zone-selector ${theme} ${containerClassName || ''}`}
        style={containerStyle}
      >
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          bounds={bounds}
          className="leaflet-zone-selector__map"
          whenCreated={handleMapReady}
          keyboard={enableKeyboardNavigation}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {zones.length > 0 && (
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
              onZoneHover={onZoneHover}
              theme={theme}
            />
          )}
          
          {enableDrawing && (
            <DrawingTools
              onShapeCreated={(shape) => {
                // Handle custom drawn shapes
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
      </div>
    </ErrorBoundary>
  );
});

LeafletZoneSelector.displayName = 'LeafletZoneSelector';
```

### Styling
```css
/* src/components/LeafletZoneSelector/LeafletZoneSelector.css */
.leaflet-zone-selector {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.leaflet-zone-selector__map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Theme: Light */
.leaflet-zone-selector.light {
  --zone-default-fill: rgba(59, 130, 246, 0.1);
  --zone-default-stroke: #3b82f6;
  --zone-hover-fill: rgba(59, 130, 246, 0.2);
  --zone-hover-stroke: #2563eb;
  --zone-selected-fill: rgba(59, 130, 246, 0.3);
  --zone-selected-stroke: #1d4ed8;
}

/* Theme: Dark */
.leaflet-zone-selector.dark {
  --zone-default-fill: rgba(96, 165, 250, 0.1);
  --zone-default-stroke: #60a5fa;
  --zone-hover-fill: rgba(96, 165, 250, 0.2);
  --zone-hover-stroke: #3b82f6;
  --zone-selected-fill: rgba(96, 165, 250, 0.3);
  --zone-selected-stroke: #2563eb;
}

/* Responsive */
@media (max-width: 768px) {
  .leaflet-zone-selector {
    min-height: 300px;
  }
}
```

## Testing Requirements

- [ ] Component renders without errors
- [ ] Map initializes with correct center and zoom
- [ ] Zone selection works via click
- [ ] Multi-selection respects limits
- [ ] Theme switching works correctly
- [ ] Ref methods function properly
- [ ] Error boundary catches and reports errors
- [ ] Loading states display correctly

### Test Examples
```typescript
describe('LeafletZoneSelector', () => {
  it('should initialize map with provided center and zoom', () => {
    const { container } = render(
      <LeafletZoneSelector
        initialCenter={[51.505, -0.09]}
        initialZoom={13}
      />
    );
    
    const map = container.querySelector('.leaflet-container');
    expect(map).toHaveAttribute('data-center', '[51.505,-0.09]');
    expect(map).toHaveAttribute('data-zoom', '13');
  });

  it('should handle zone selection', async () => {
    const onSelectionChange = jest.fn();
    const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
    
    render(
      <LeafletZoneSelector
        zones={zones}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const zone1 = screen.getByTestId('zone-zone-1');
    fireEvent.click(zone1);
    
    expect(onSelectionChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'zone-1' })
    ]);
  });
});
```

## Performance Considerations

- Lazy load zones for large datasets
- Use React.memo for child components
- Implement virtual scrolling for zone lists
- Debounce hover events
- Use CSS containment for better rendering

## Accessibility

- Keyboard navigation for zone selection
- ARIA labels for interactive elements
- Screen reader announcements for state changes
- Focus management for search and tools
- High contrast mode support

## Related Issues

- #5: OpenStreetMap tile layer integration
- #6: Zone Layer component
- #8: Search Input component
- #9: Drawing Tools component
- #19: useZoneSelection hook