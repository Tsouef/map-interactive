# Issue #12: Calculate Zone Area and Perimeter Metrics

**Labels**: feature, metrics, turf, low-priority

## Description

Implement comprehensive geographic metrics calculation for selected zones, including area, perimeter, centroid, and other useful measurements using Turf.js.

## Acceptance Criteria

- [ ] Calculate area in multiple units (m², km², hectares, acres)
- [ ] Calculate perimeter in meters and kilometers
- [ ] Find centroid of each zone
- [ ] Calculate total metrics for multiple selections
- [ ] Estimate population (if data available)
- [ ] Calculate convex hull and compactness
- [ ] Display metrics in real-time
- [ ] Export metrics with selections

## Technical Implementation

### Metrics Types
```typescript
// src/types/metrics.ts
export interface ZoneMetrics {
  /** Zone identifier */
  zoneId: string;
  
  /** Area measurements */
  area: {
    squareMeters: number;
    squareKilometers: number;
    hectares: number;
    acres: number;
  };
  
  /** Perimeter in meters */
  perimeter: number;
  
  /** Centroid coordinates [lng, lat] */
  centroid: Coordinates;
  
  /** Bounding box */
  bounds: BoundingBox;
  
  /** Number of vertices */
  vertexCount: number;
  
  /** Complexity score (0-1) based on vertices and area */
  complexity: number;
  
  /** Optional demographic data */
  demographics?: {
    estimatedPopulation?: number;
    populationDensity?: number; // per km²
  };
}

export interface SelectionMetrics {
  /** Individual zone metrics */
  zones: ZoneMetrics[];
  
  /** Aggregated metrics */
  total: {
    area: {
      squareMeters: number;
      squareKilometers: number;
      hectares: number;
      acres: number;
    };
    perimeter: number;
    zones: number;
  };
  
  /** Selection-wide calculations */
  combined: {
    bounds: BoundingBox;
    centroid: Coordinates;
    convexHull?: GeoJSON.Polygon;
    convexHullArea?: number;
    compactness: number; // 0-1, where 1 is perfectly compact (circle)
    averageZoneSize: number;
    largestZone?: string;
    smallestZone?: string;
  };
  
  /** Time-based metrics */
  calculated: {
    timestamp: Date;
    calculationTime: number; // milliseconds
  };
}
```

### Metrics Calculation Service
```typescript
// src/utils/metricsCalculator.ts
import * as turf from '@turf/turf';
import type { Zone, ZoneMetrics, SelectionMetrics } from '@/types';

export class MetricsCalculator {
  /**
   * Calculate metrics for a single zone
   */
  static calculateZoneMetrics(zone: Zone): ZoneMetrics {
    const feature = turf.feature(zone.geometry);
    
    // Area calculations
    const areaM2 = turf.area(feature);
    const areaKm2 = areaM2 / 1_000_000;
    const areaHectares = areaM2 / 10_000;
    const areaAcres = areaM2 / 4_047;
    
    // Perimeter
    const perimeter = this.calculatePerimeter(zone.geometry);
    
    // Centroid
    const centroidFeature = turf.centroid(feature);
    const centroid = centroidFeature.geometry.coordinates as Coordinates;
    
    // Bounds
    const bounds = turf.bbox(feature) as BoundingBox;
    
    // Vertex count
    const vertexCount = this.countVertices(zone.geometry);
    
    // Complexity score (normalized by area)
    const complexity = Math.min(1, vertexCount / (Math.sqrt(areaM2) / 100));
    
    return {
      zoneId: zone.id,
      area: {
        squareMeters: areaM2,
        squareKilometers: areaKm2,
        hectares: areaHectares,
        acres: areaAcres
      },
      perimeter,
      centroid,
      bounds,
      vertexCount,
      complexity,
      demographics: zone.properties?.demographics
    };
  }
  
  /**
   * Calculate metrics for multiple zones
   */
  static calculateSelectionMetrics(zones: Zone[]): SelectionMetrics {
    const startTime = performance.now();
    
    // Calculate individual zone metrics
    const zoneMetrics = zones.map(zone => this.calculateZoneMetrics(zone));
    
    // Sort by area
    const sortedByArea = [...zoneMetrics].sort((a, b) => 
      b.area.squareMeters - a.area.squareMeters
    );
    
    // Calculate totals
    const totalArea = zoneMetrics.reduce((sum, zm) => ({
      squareMeters: sum.squareMeters + zm.area.squareMeters,
      squareKilometers: sum.squareKilometers + zm.area.squareKilometers,
      hectares: sum.hectares + zm.area.hectares,
      acres: sum.acres + zm.area.acres
    }), {
      squareMeters: 0,
      squareKilometers: 0,
      hectares: 0,
      acres: 0
    });
    
    const totalPerimeter = zoneMetrics.reduce((sum, zm) => sum + zm.perimeter, 0);
    
    // Calculate combined metrics
    const allFeatures = zones.map(z => turf.feature(z.geometry));
    const featureCollection = turf.featureCollection(allFeatures);
    
    // Combined bounds
    const combinedBounds = turf.bbox(featureCollection) as BoundingBox;
    
    // Combined centroid (weighted by area)
    const combinedCentroid = this.calculateWeightedCentroid(zoneMetrics);
    
    // Convex hull
    let convexHull: GeoJSON.Polygon | undefined;
    let convexHullArea: number | undefined;
    let compactness = 0;
    
    if (zones.length > 2) {
      try {
        const hull = turf.convex(featureCollection);
        if (hull) {
          convexHull = hull.geometry;
          convexHullArea = turf.area(hull);
          
          // Compactness: ratio of total area to convex hull area
          compactness = totalArea.squareMeters / convexHullArea;
        }
      } catch (error) {
        console.warn('Could not calculate convex hull:', error);
      }
    }
    
    const endTime = performance.now();
    
    return {
      zones: zoneMetrics,
      total: {
        area: totalArea,
        perimeter: totalPerimeter,
        zones: zones.length
      },
      combined: {
        bounds: combinedBounds,
        centroid: combinedCentroid,
        convexHull,
        convexHullArea,
        compactness,
        averageZoneSize: totalArea.squareMeters / zones.length,
        largestZone: sortedByArea[0]?.zoneId,
        smallestZone: sortedByArea[sortedByArea.length - 1]?.zoneId
      },
      calculated: {
        timestamp: new Date(),
        calculationTime: endTime - startTime
      }
    };
  }
  
  /**
   * Calculate perimeter of a polygon
   */
  private static calculatePerimeter(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
    if (geometry.type === 'Polygon') {
      return turf.length(turf.polygon(geometry.coordinates), { units: 'meters' });
    } else {
      // MultiPolygon: sum of all polygon perimeters
      return geometry.coordinates.reduce((sum, polygon) => {
        return sum + turf.length(turf.polygon(polygon), { units: 'meters' });
      }, 0);
    }
  }
  
  /**
   * Count vertices in a geometry
   */
  private static countVertices(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
    if (geometry.type === 'Polygon') {
      return geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0);
    } else {
      return geometry.coordinates.reduce((sum, polygon) => {
        return sum + polygon.reduce((ringSum, ring) => ringSum + ring.length, 0);
      }, 0);
    }
  }
  
  /**
   * Calculate weighted centroid based on area
   */
  private static calculateWeightedCentroid(zoneMetrics: ZoneMetrics[]): Coordinates {
    const totalArea = zoneMetrics.reduce((sum, zm) => sum + zm.area.squareMeters, 0);
    
    const weightedLng = zoneMetrics.reduce((sum, zm) => {
      const weight = zm.area.squareMeters / totalArea;
      return sum + (zm.centroid[0] * weight);
    }, 0);
    
    const weightedLat = zoneMetrics.reduce((sum, zm) => {
      const weight = zm.area.squareMeters / totalArea;
      return sum + (zm.centroid[1] * weight);
    }, 0);
    
    return [weightedLng, weightedLat];
  }
}
```

### Metrics Display Component
```tsx
// src/components/MetricsDisplay/MetricsDisplay.tsx
import React, { useMemo } from 'react';
import { MetricsCalculator } from '@/utils/metricsCalculator';
import type { Zone } from '@/types';
import './MetricsDisplay.css';

interface MetricsDisplayProps {
  zones: Zone[];
  className?: string;
  compact?: boolean;
  showIndividualZones?: boolean;
  units?: {
    area?: 'metric' | 'imperial' | 'both';
    distance?: 'metric' | 'imperial' | 'both';
  };
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  zones,
  className,
  compact = false,
  showIndividualZones = false,
  units = { area: 'metric', distance: 'metric' }
}) => {
  const metrics = useMemo(() => {
    if (zones.length === 0) return null;
    return MetricsCalculator.calculateSelectionMetrics(zones);
  }, [zones]);
  
  if (!metrics || zones.length === 0) {
    return (
      <div className={`metrics-display metrics-display--empty ${className || ''}`}>
        <p>No zones selected</p>
      </div>
    );
  }
  
  const formatArea = (area: typeof metrics.total.area) => {
    if (units.area === 'imperial' || units.area === 'both') {
      return `${area.acres.toFixed(2)} acres`;
    }
    
    if (area.squareKilometers >= 1) {
      return `${area.squareKilometers.toFixed(2)} km²`;
    } else if (area.hectares >= 1) {
      return `${area.hectares.toFixed(2)} ha`;
    } else {
      return `${area.squareMeters.toFixed(0)} m²`;
    }
  };
  
  const formatDistance = (meters: number) => {
    if (units.distance === 'imperial' || units.distance === 'both') {
      const miles = meters / 1609.344;
      return miles >= 1 
        ? `${miles.toFixed(2)} mi`
        : `${(miles * 5280).toFixed(0)} ft`;
    }
    
    return meters >= 1000
      ? `${(meters / 1000).toFixed(2)} km`
      : `${meters.toFixed(0)} m`;
  };
  
  if (compact) {
    return (
      <div className={`metrics-display metrics-display--compact ${className || ''}`}>
        <span className="metrics-display__stat">
          <strong>{metrics.total.zones}</strong> zones
        </span>
        <span className="metrics-display__stat">
          <strong>{formatArea(metrics.total.area)}</strong>
        </span>
        <span className="metrics-display__stat">
          <strong>{formatDistance(metrics.total.perimeter)}</strong> perimeter
        </span>
      </div>
    );
  }
  
  return (
    <div className={`metrics-display ${className || ''}`}>
      <div className="metrics-display__summary">
        <h3>Selection Metrics</h3>
        <dl>
          <dt>Total Zones</dt>
          <dd>{metrics.total.zones}</dd>
          
          <dt>Total Area</dt>
          <dd>{formatArea(metrics.total.area)}</dd>
          
          <dt>Total Perimeter</dt>
          <dd>{formatDistance(metrics.total.perimeter)}</dd>
          
          <dt>Average Zone Size</dt>
          <dd>{formatArea({
            squareMeters: metrics.combined.averageZoneSize,
            squareKilometers: metrics.combined.averageZoneSize / 1_000_000,
            hectares: metrics.combined.averageZoneSize / 10_000,
            acres: metrics.combined.averageZoneSize / 4_047
          })}</dd>
          
          {metrics.combined.compactness > 0 && (
            <>
              <dt>Compactness</dt>
              <dd>{(metrics.combined.compactness * 100).toFixed(1)}%</dd>
            </>
          )}
        </dl>
      </div>
      
      {showIndividualZones && (
        <div className="metrics-display__zones">
          <h4>Individual Zones</h4>
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Area</th>
                <th>Perimeter</th>
              </tr>
            </thead>
            <tbody>
              {metrics.zones.map(zm => (
                <tr key={zm.zoneId}>
                  <td>{zm.zoneId}</td>
                  <td>{formatArea(zm.area)}</td>
                  <td>{formatDistance(zm.perimeter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

### Hook for Real-time Metrics
```typescript
// src/hooks/useZoneMetrics.ts
import { useMemo, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { MetricsCalculator } from '@/utils/metricsCalculator';
import type { Zone, SelectionMetrics } from '@/types';

interface UseZoneMetricsOptions {
  /** Debounce calculation in ms */
  debounceMs?: number;
  /** Enable Web Worker for calculations */
  useWebWorker?: boolean;
  /** Cache results */
  enableCache?: boolean;
}

export function useZoneMetrics(
  zones: Zone[],
  options: UseZoneMetricsOptions = {}
): {
  metrics: SelectionMetrics | null;
  isCalculating: boolean;
  error: Error | null;
} {
  const { debounceMs = 300, useWebWorker = false, enableCache = true } = options;
  
  const [metrics, setMetrics] = useState<SelectionMetrics | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Debounce zones to avoid excessive calculations
  const debouncedZones = useDebounce(zones, debounceMs);
  
  // Cache key based on zone IDs
  const cacheKey = useMemo(() => {
    return debouncedZones.map(z => z.id).sort().join(',');
  }, [debouncedZones]);
  
  // Calculate metrics
  useEffect(() => {
    if (debouncedZones.length === 0) {
      setMetrics(null);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    // In production, this could use a Web Worker
    try {
      const calculated = MetricsCalculator.calculateSelectionMetrics(debouncedZones);
      setMetrics(calculated);
    } catch (err) {
      setError(err as Error);
      setMetrics(null);
    } finally {
      setIsCalculating(false);
    }
  }, [cacheKey, debouncedZones]);
  
  return { metrics, isCalculating, error };
}
```

## Testing Requirements

- [ ] Area calculations are accurate
- [ ] Perimeter calculations handle complex shapes
- [ ] Centroid is correctly positioned
- [ ] Multi-polygon geometries handled
- [ ] Performance acceptable for 1000+ zones
- [ ] Units conversion is correct
- [ ] Real-time updates work smoothly
- [ ] Export includes metrics

## Performance Optimization

- Use Web Workers for large calculations
- Cache results by zone ID
- Debounce real-time updates
- Simplify geometries before calculation
- Progressive calculation for UI responsiveness

## Related Issues

- #4: Display metrics in main component
- #30: Export metrics with GeoJSON
- #11: Calculate metrics for drawn shapes