# Issue #9: Implement Adjacent Zone Detection and Merging Using Turf.js

**Labels**: algorithm, geographic, turf, medium-priority

## Description

Implement an efficient algorithm to detect adjacent zones and automatically merge them into single polygons using Turf.js, with support for complex geometries and performance optimization.

## Acceptance Criteria

- [ ] Detect zones sharing borders accurately
- [ ] Merge adjacent zones into single polygons
- [ ] Handle MultiPolygon geometries
- [ ] Support configurable adjacency tolerance
- [ ] Optimize for performance with spatial indexing
- [ ] Preserve zone metadata after merging
- [ ] Handle edge cases (touching at points, small gaps)
- [ ] Support undo of merge operations

## Technical Implementation

### Core Algorithm
```typescript
// src/utils/mergeAdjacentZones/types.ts
export interface MergeOptions {
  /** Distance tolerance for adjacency detection (meters) */
  tolerance?: number;
  
  /** Preserve properties from original zones */
  preserveProperties?: boolean;
  
  /** Simplify merged geometry */
  simplify?: boolean;
  
  /** Simplification tolerance */
  simplifyTolerance?: number;
  
  /** Use spatial index for performance */
  useSpatialIndex?: boolean;
  
  /** Custom property merger function */
  propertyMerger?: (zones: Zone[]) => Record<string, any>;
}

export interface MergeResult {
  /** Merged polygon groups */
  mergedGroups: MergedZoneGroup[];
  
  /** Zones that couldn't be merged */
  unmergedZones: Zone[];
  
  /** Performance metrics */
  metrics: {
    totalZones: number;
    mergedGroups: number;
    processingTime: number;
  };
}

export interface MergedZoneGroup {
  /** Combined geometry */
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  
  /** Original zone IDs */
  zoneIds: string[];
  
  /** Merged properties */
  properties: Record<string, any>;
  
  /** Bounding box */
  bbox: BoundingBox;
}
```

### Main Merging Function
```typescript
// src/utils/mergeAdjacentZones/mergeAdjacentZones.ts
import * as turf from '@turf/turf';
import { SpatialIndex } from './spatialIndex';
import { detectAdjacency } from './adjacencyDetection';
import { UnionFind } from './unionFind';
import type { Zone, MergeOptions, MergeResult } from './types';

export function mergeAdjacentZones(
  zones: Zone[],
  options: MergeOptions = {}
): MergeResult {
  const {
    tolerance = 0.1,
    preserveProperties = true,
    simplify = true,
    simplifyTolerance = 0.001,
    useSpatialIndex = zones.length > 50,
    propertyMerger = defaultPropertyMerger
  } = options;

  const startTime = performance.now();
  
  // Step 1: Build spatial index for performance
  const spatialIndex = useSpatialIndex 
    ? new SpatialIndex(zones)
    : null;

  // Step 2: Find adjacent zone pairs
  const adjacencyPairs = findAdjacentPairs(zones, tolerance, spatialIndex);
  
  // Step 3: Group connected zones using Union-Find
  const groups = groupConnectedZones(zones, adjacencyPairs);
  
  // Step 4: Merge each group
  const mergedGroups: MergedZoneGroup[] = [];
  const unmergedZones: Zone[] = [];

  for (const group of groups) {
    if (group.length === 1) {
      // Single zone, not merged
      unmergedZones.push(group[0]);
      continue;
    }

    try {
      const merged = mergeZoneGroup(group, {
        preserveProperties,
        simplify,
        simplifyTolerance,
        propertyMerger
      });
      mergedGroups.push(merged);
    } catch (error) {
      console.error('Failed to merge zone group:', error);
      unmergedZones.push(...group);
    }
  }

  const endTime = performance.now();

  return {
    mergedGroups,
    unmergedZones,
    metrics: {
      totalZones: zones.length,
      mergedGroups: mergedGroups.length,
      processingTime: endTime - startTime
    }
  };
}

function findAdjacentPairs(
  zones: Zone[],
  tolerance: number,
  spatialIndex: SpatialIndex | null
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  
  for (let i = 0; i < zones.length; i++) {
    const zone1 = zones[i];
    
    // Get candidate zones using spatial index or check all
    const candidates = spatialIndex
      ? spatialIndex.query(zone1.bbox || turf.bbox(zone1.geometry))
      : zones.slice(i + 1);
    
    for (const zone2 of candidates) {
      const j = zones.indexOf(zone2);
      if (j <= i) continue; // Avoid duplicates
      
      if (detectAdjacency(zone1, zone2, tolerance)) {
        pairs.push([i, j]);
      }
    }
  }
  
  return pairs;
}

function groupConnectedZones(
  zones: Zone[],
  adjacencyPairs: Array<[number, number]>
): Zone[][] {
  const uf = new UnionFind(zones.length);
  
  // Union adjacent zones
  for (const [i, j] of adjacencyPairs) {
    uf.union(i, j);
  }
  
  // Group zones by their root
  const groups = new Map<number, Zone[]>();
  
  for (let i = 0; i < zones.length; i++) {
    const root = uf.find(i);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root)!.push(zones[i]);
  }
  
  return Array.from(groups.values());
}

function mergeZoneGroup(
  zones: Zone[],
  options: {
    preserveProperties: boolean;
    simplify: boolean;
    simplifyTolerance: number;
    propertyMerger: (zones: Zone[]) => Record<string, any>;
  }
): MergedZoneGroup {
  // Convert zones to features
  const features = zones.map(zone => 
    turf.feature(zone.geometry, zone.properties)
  );
  
  // Perform union operation
  let merged = features[0];
  for (let i = 1; i < features.length; i++) {
    merged = turf.union(merged as any, features[i] as any)!;
  }
  
  // Simplify if requested
  if (options.simplify && merged) {
    merged = turf.simplify(merged, {
      tolerance: options.simplifyTolerance,
      highQuality: true
    });
  }
  
  // Merge properties
  const properties = options.preserveProperties
    ? options.propertyMerger(zones)
    : {};
  
  return {
    geometry: merged.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    zoneIds: zones.map(z => z.id),
    properties,
    bbox: turf.bbox(merged) as BoundingBox
  };
}

function defaultPropertyMerger(zones: Zone[]): Record<string, any> {
  return {
    mergedFrom: zones.map(z => z.id),
    mergedNames: zones.map(z => z.name),
    mergedCount: zones.length,
    totalArea: zones.reduce((sum, z) => 
      sum + (z.properties?.area || turf.area(z.geometry)), 0
    ),
    mergedAt: new Date().toISOString()
  };
}
```

### Adjacency Detection
```typescript
// src/utils/mergeAdjacentZones/adjacencyDetection.ts
import * as turf from '@turf/turf';
import type { Zone } from './types';

export function detectAdjacency(
  zone1: Zone,
  zone2: Zone,
  tolerance: number = 0.1
): boolean {
  // Quick bbox check first
  if (!bboxesOverlap(zone1, zone2, tolerance)) {
    return false;
  }
  
  try {
    // Method 1: Check if zones intersect when buffered
    const buffered1 = turf.buffer(zone1.geometry, tolerance, { units: 'meters' });
    const buffered2 = turf.buffer(zone2.geometry, tolerance, { units: 'meters' });
    
    if (!buffered1 || !buffered2) return false;
    
    const intersects = turf.booleanIntersects(buffered1, buffered2);
    if (!intersects) return false;
    
    // Method 2: Check if they share edges (not just touch at points)
    const intersection = turf.intersect(buffered1, buffered2);
    if (!intersection) return false;
    
    // Check if intersection is more than just a point
    const intersectionArea = turf.area(intersection);
    const intersectionLength = turf.length(intersection, { units: 'meters' });
    
    // Consider adjacent if they share a meaningful edge
    return intersectionLength > tolerance * 10; // Arbitrary threshold
    
  } catch (error) {
    console.warn('Adjacency detection error:', error);
    return false;
  }
}

function bboxesOverlap(
  zone1: Zone,
  zone2: Zone,
  buffer: number
): boolean {
  const bbox1 = zone1.bbox || turf.bbox(zone1.geometry);
  const bbox2 = zone2.bbox || turf.bbox(zone2.geometry);
  
  // Convert buffer from meters to approximate degrees
  const bufferDeg = buffer / 111000; // Rough conversion
  
  return !(
    bbox1[2] + bufferDeg < bbox2[0] || // max lon 1 < min lon 2
    bbox1[0] - bufferDeg > bbox2[2] || // min lon 1 > max lon 2
    bbox1[3] + bufferDeg < bbox2[1] || // max lat 1 < min lat 2
    bbox1[1] - bufferDeg > bbox2[3]    // min lat 1 > max lat 2
  );
}
```

### Spatial Index
```typescript
// src/utils/mergeAdjacentZones/spatialIndex.ts
import RBush from 'rbush';
import type { Zone, BoundingBox } from './types';

interface IndexItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zone: Zone;
}

export class SpatialIndex {
  private index: RBush<IndexItem>;
  
  constructor(zones: Zone[]) {
    this.index = new RBush();
    
    const items: IndexItem[] = zones.map(zone => {
      const bbox = zone.bbox || turf.bbox(zone.geometry);
      return {
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        zone
      };
    });
    
    this.index.load(items);
  }
  
  query(bbox: BoundingBox): Zone[] {
    const results = this.index.search({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    });
    
    return results.map(item => item.zone);
  }
  
  add(zone: Zone): void {
    const bbox = zone.bbox || turf.bbox(zone.geometry);
    this.index.insert({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      zone
    });
  }
  
  remove(zone: Zone): void {
    const bbox = zone.bbox || turf.bbox(zone.geometry);
    const item = this.index.search({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    }).find(i => i.zone.id === zone.id);
    
    if (item) {
      this.index.remove(item);
    }
  }
}
```

### Union-Find Data Structure
```typescript
// src/utils/mergeAdjacentZones/unionFind.ts
export class UnionFind {
  private parent: number[];
  private rank: number[];
  
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }
  
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }
  
  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
  }
  
  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}
```

## Testing Requirements

- [ ] Two adjacent zones merge correctly
- [ ] Non-adjacent zones remain separate
- [ ] Chain of adjacent zones all merge
- [ ] Zones touching at points handled correctly
- [ ] MultiPolygon geometries supported
- [ ] Performance acceptable for 1000+ zones
- [ ] Properties preserved correctly
- [ ] Edge cases don't crash

### Test Examples
```typescript
describe('mergeAdjacentZones', () => {
  it('should merge adjacent zones', () => {
    const zones = [
      createZone('A', [[0,0], [1,0], [1,1], [0,1], [0,0]]),
      createZone('B', [[1,0], [2,0], [2,1], [1,1], [1,0]])
    ];
    
    const result = mergeAdjacentZones(zones);
    
    expect(result.mergedGroups).toHaveLength(1);
    expect(result.mergedGroups[0].zoneIds).toEqual(['A', 'B']);
    expect(result.unmergedZones).toHaveLength(0);
  });

  it('should handle complex adjacency patterns', () => {
    // Create a grid of zones
    const zones = createGridZones(10, 10);
    
    const result = mergeAdjacentZones(zones, {
      tolerance: 0.01,
      useSpatialIndex: true
    });
    
    // All zones should merge into one
    expect(result.mergedGroups).toHaveLength(1);
    expect(result.mergedGroups[0].zoneIds).toHaveLength(100);
  });
});
```

## Performance Targets

- < 100ms for 100 zones
- < 1s for 1000 zones
- < 5s for 5000 zones
- Memory usage < O(n²)

## Related Issues

- #6: ZoneLayer renders merged polygons
- #8: Selection hook triggers merging
- #10: Geographic utilities for calculations
- #16: Performance optimization