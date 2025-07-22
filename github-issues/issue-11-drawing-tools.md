# Issue #11: Integrate Leaflet-Draw for Custom Shapes

**Labels**: component, drawing, leaflet-draw, low-priority

## Description

Integrate leaflet-draw to allow users to create custom zones by drawing polygons, rectangles, circles, and freehand shapes on the map.

## Acceptance Criteria

- [ ] Drawing toolbar with polygon, rectangle, circle tools
- [ ] Freehand drawing mode
- [ ] Edit existing drawn shapes
- [ ] Delete drawn shapes
- [ ] Convert drawn shapes to zones
- [ ] Snap-to-grid option
- [ ] Drawing constraints (min/max area)
- [ ] Touch device support

## Technical Implementation

### Drawing Tools Component
```typescript
// src/components/DrawingTools/types.ts
export interface DrawingToolsProps {
  enabled: boolean;
  mode?: DrawingMode;
  tools?: DrawingTool[];
  
  // Constraints
  maxShapes?: number;
  minArea?: number;
  maxArea?: number;
  
  // Behavior
  snapToGrid?: boolean;
  gridSize?: number;
  allowEdit?: boolean;
  allowDelete?: boolean;
  
  // Callbacks
  onShapeCreated?: (shape: DrawnShape) => void;
  onShapeEdited?: (shape: DrawnShape) => void;
  onShapeDeleted?: (shapeId: string) => void;
  onDrawStart?: (mode: DrawingMode) => void;
  onDrawStop?: () => void;
  
  // Styling
  drawOptions?: L.DrawOptions;
  editOptions?: L.EditOptions;
}

export type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'polyline' | 'marker';
export type DrawingTool = 'draw' | 'edit' | 'delete' | 'clear';

export interface DrawnShape {
  id: string;
  type: DrawingMode;
  geometry: GeoJSON.Geometry;
  properties?: Record<string, any>;
  area?: number;
  perimeter?: number;
}
```

### Main Component
```tsx
// src/components/DrawingTools/DrawingTools.tsx
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import type { DrawingToolsProps, DrawnShape } from './types';

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  enabled,
  mode = 'polygon',
  tools = ['draw', 'edit', 'delete'],
  maxShapes,
  minArea,
  maxArea,
  snapToGrid = false,
  gridSize = 10,
  allowEdit = true,
  allowDelete = true,
  onShapeCreated,
  onShapeEdited,
  onShapeDeleted,
  onDrawStart,
  onDrawStop,
  drawOptions = {},
  editOptions = {}
}) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const shapesRef = useRef<Map<string, DrawnShape>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Add drawn items layer to map
    map.addLayer(drawnItemsRef.current);

    // Create draw control
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: enabled ? {
        polygon: tools.includes('draw') && (mode === 'polygon' || !mode) ? {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
            ...drawOptions.polygon
          },
          ...drawOptions.polygon
        } : false,
        rectangle: tools.includes('draw') && mode === 'rectangle' ? {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
            ...drawOptions.rectangle
          },
          ...drawOptions.rectangle
        } : false,
        circle: tools.includes('draw') && mode === 'circle' ? {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
            ...drawOptions.circle
          },
          ...drawOptions.circle
        } : false,
        polyline: false,
        marker: false,
        circlemarker: false
      } : false,
      edit: tools.includes('edit') && allowEdit ? {
        featureGroup: drawnItemsRef.current,
        remove: tools.includes('delete') && allowDelete,
        ...editOptions
      } : false
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Event handlers
    const handleDrawCreated = (e: L.DrawEvents.Created) => {
      const { layer, layerType } = e;
      
      // Generate shape ID
      const shapeId = uuidv4();
      
      // Convert to GeoJSON
      const geoJson = (layer as any).toGeoJSON();
      
      // Calculate metrics
      const area = turf.area(geoJson);
      const perimeter = turf.length(geoJson, { units: 'meters' });
      
      // Validate constraints
      if (minArea && area < minArea) {
        alert(`Shape is too small. Minimum area: ${minArea}m²`);
        return;
      }
      
      if (maxArea && area > maxArea) {
        alert(`Shape is too large. Maximum area: ${maxArea}m²`);
        return;
      }
      
      if (maxShapes && shapesRef.current.size >= maxShapes) {
        alert(`Maximum number of shapes (${maxShapes}) reached`);
        return;
      }
      
      // Create shape object
      const shape: DrawnShape = {
        id: shapeId,
        type: layerType as DrawingMode,
        geometry: geoJson.geometry,
        area,
        perimeter
      };
      
      // Store shape
      shapesRef.current.set(shapeId, shape);
      (layer as any)._shapeId = shapeId;
      
      // Add to map
      drawnItemsRef.current.addLayer(layer);
      
      // Callback
      onShapeCreated?.(shape);
    };

    const handleDrawStart = (e: L.DrawEvents.DrawStart) => {
      onDrawStart?.(e.layerType as DrawingMode);
    };

    const handleDrawStop = () => {
      onDrawStop?.();
    };

    const handleDrawEdited = (e: L.DrawEvents.Edited) => {
      const { layers } = e;
      
      layers.eachLayer((layer: any) => {
        const shapeId = layer._shapeId;
        if (!shapeId) return;
        
        const shape = shapesRef.current.get(shapeId);
        if (!shape) return;
        
        // Update geometry
        const geoJson = layer.toGeoJSON();
        shape.geometry = geoJson.geometry;
        shape.area = turf.area(geoJson);
        shape.perimeter = turf.length(geoJson, { units: 'meters' });
        
        onShapeEdited?.(shape);
      });
    };

    const handleDrawDeleted = (e: L.DrawEvents.Deleted) => {
      const { layers } = e;
      
      layers.eachLayer((layer: any) => {
        const shapeId = layer._shapeId;
        if (!shapeId) return;
        
        shapesRef.current.delete(shapeId);
        onShapeDeleted?.(shapeId);
      });
    };

    // Register event handlers
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.DRAWSTART, handleDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, handleDrawStop);
    map.on(L.Draw.Event.EDITED, handleDrawEdited);
    map.on(L.Draw.Event.DELETED, handleDrawDeleted);

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, handleDrawStop);
      map.off(L.Draw.Event.EDITED, handleDrawEdited);
      map.off(L.Draw.Event.DELETED, handleDrawDeleted);
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      
      map.removeLayer(drawnItemsRef.current);
    };
  }, [map, enabled, mode, tools, maxShapes, minArea, maxArea, allowEdit, allowDelete, onShapeCreated, onShapeEdited, onShapeDeleted, onDrawStart, onDrawStop]);

  // Snap to grid functionality
  useEffect(() => {
    if (!snapToGrid || !map) return;

    const snapPoint = (latlng: L.LatLng): L.LatLng => {
      const lat = Math.round(latlng.lat / gridSize) * gridSize;
      const lng = Math.round(latlng.lng / gridSize) * gridSize;
      return L.latLng(lat, lng);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      // Snap cursor position during drawing
      if (map.hasLayer(drawnItemsRef.current)) {
        e.latlng = snapPoint(e.latlng);
      }
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, snapToGrid, gridSize]);

  return null; // This component only adds controls to the map
};
```

### Freehand Drawing Extension
```typescript
// src/components/DrawingTools/FreehandDraw.ts
import L from 'leaflet';

export class FreehandDraw {
  private map: L.Map;
  private points: L.LatLng[] = [];
  private polyline: L.Polyline | null = null;
  private enabled: boolean = false;
  
  constructor(map: L.Map) {
    this.map = map;
  }
  
  enable() {
    this.enabled = true;
    this.map.dragging.disable();
    L.DomUtil.addClass(this.map.getContainer(), 'leaflet-freehand-draw');
    
    this.map.on('mousedown', this.startDrawing, this);
    this.map.on('touchstart', this.startDrawing, this);
  }
  
  disable() {
    this.enabled = false;
    this.map.dragging.enable();
    L.DomUtil.removeClass(this.map.getContainer(), 'leaflet-freehand-draw');
    
    this.map.off('mousedown', this.startDrawing, this);
    this.map.off('touchstart', this.startDrawing, this);
    
    this.stopDrawing();
  }
  
  private startDrawing = (e: L.LeafletMouseEvent) => {
    if (!this.enabled) return;
    
    this.points = [e.latlng];
    
    this.polyline = L.polyline(this.points, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.8
    }).addTo(this.map);
    
    this.map.on('mousemove', this.continueDrawing, this);
    this.map.on('mouseup', this.stopDrawing, this);
    this.map.on('touchmove', this.continueDrawing, this);
    this.map.on('touchend', this.stopDrawing, this);
  };
  
  private continueDrawing = (e: L.LeafletMouseEvent) => {
    if (!this.polyline) return;
    
    this.points.push(e.latlng);
    this.polyline.setLatLngs(this.points);
  };
  
  private stopDrawing = () => {
    this.map.off('mousemove', this.continueDrawing, this);
    this.map.off('mouseup', this.stopDrawing, this);
    this.map.off('touchmove', this.continueDrawing, this);
    this.map.off('touchend', this.stopDrawing, this);
    
    if (this.polyline && this.points.length > 2) {
      // Close the polygon
      this.points.push(this.points[0]);
      
      // Create polygon from points
      const polygon = L.polygon(this.points, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2
      });
      
      // Fire created event
      this.map.fire('draw:created', {
        layer: polygon,
        layerType: 'polygon'
      });
      
      // Remove temporary polyline
      this.map.removeLayer(this.polyline);
    }
    
    this.polyline = null;
    this.points = [];
  };
}
```

## Testing Requirements

- [ ] Drawing tools appear when enabled
- [ ] Each tool creates correct shape type
- [ ] Constraints are enforced
- [ ] Edit mode updates shapes correctly
- [ ] Delete removes shapes
- [ ] Touch gestures work on mobile
- [ ] Snap to grid functions correctly
- [ ] Events fire with correct data

## Styling

```css
/* Custom drawing styles */
.leaflet-draw-toolbar {
  margin-top: 12px !important;
}

.leaflet-freehand-draw {
  cursor: crosshair !important;
}

.leaflet-draw-tooltip {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
}

/* Dark theme support */
.dark .leaflet-draw-toolbar a {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}
```

## Integration Example

```tsx
<LeafletZoneSelector
  enableDrawing={true}
  onSelectionChange={(zones) => {
    // Regular zone selection
  }}
>
  <DrawingTools
    enabled={true}
    mode="polygon"
    maxShapes={5}
    minArea={1000} // 1000 m²
    onShapeCreated={(shape) => {
      // Convert drawn shape to zone
      const customZone = {
        id: `custom-${shape.id}`,
        name: 'Custom Zone',
        geometry: shape.geometry,
        properties: {
          isCustom: true,
          area: shape.area
        }
      };
      addCustomZone(customZone);
    }}
  />
</LeafletZoneSelector>
```

## Performance Considerations

- Limit number of vertices in freehand mode
- Simplify complex polygons after drawing
- Debounce shape validation
- Use Web Workers for complex calculations

## Related Issues

- #4: Integration with main component
- #30: Export drawn shapes
- #31: Calculate metrics for drawn shapes