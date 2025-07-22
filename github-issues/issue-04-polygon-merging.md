# Issue #4: Implement Automatic Polygon Merging for Adjacent Zones

**Labels**: algorithm, feature, geographic, high-priority

## Description

Implement an algorithm that automatically detects and merges adjacent selected zones into single polygons. This is a core feature that creates seamless territory selections.

## Acceptance Criteria

- [ ] Detect when two or more selected zones share borders
- [ ] Automatically merge adjacent zones into single polygons
- [ ] Handle complex cases (zones touching at points, multiple groups)
- [ ] Maintain performance with many zones (< 200ms for 50 zones)
- [ ] Preserve zone metadata after merging
- [ ] Support undo/redo of merge operations
- [ ] Handle both Polygon and MultiPolygon geometries

## Technical Implementation

### Core Algorithm
```typescript
interface MergeOptions {
  tolerance?: number; // Distance tolerance for adjacency (meters)
  preserveProperties?: boolean;
  simplify?: boolean;
}

export function mergeAdjacentZones(
  zones: Zone[],
  options: MergeOptions = {}
): MergedZoneFeature[] {
  // 1. Build spatial index for performance
  // 2. Detect adjacency between zones
  // 3. Group adjacent zones
  // 4. Merge each group using turf.union
  // 5. Return merged features
}
```

### Adjacency Detection
```typescript
export function detectAdjacency(
  zone1: Zone,
  zone2: Zone,
  tolerance = 0.1 // meters
): boolean {
  // Use turf.booleanOverlap or custom algorithm
  // Consider zones adjacent if they:
  // - Share at least one edge
  // - Have points within tolerance distance
  // - Handle floating point precision issues
}
```

### Example Behavior
```typescript
// Input: User selects Paris 1er, 2e, and 3e (all adjacent)
const selectedZones = [paris1er, paris2e, paris3e];

// Output: Single merged polygon
const merged = mergeAdjacentZones(selectedZones);
// merged = [{
//   type: 'Feature',
//   geometry: { type: 'Polygon', coordinates: [...] },
//   properties: {
//     mergedZones: ['paris-1', 'paris-2', 'paris-3'],
//     mergedNames: ['Paris 1er', 'Paris 2e', 'Paris 3e']
//   }
// }]
```

## Integration Tests Required

**IMPORTANT: No commits should be made before all tests pass and are validated.**

### Core Functionality Tests
- [ ] Test two adjacent zones merge into one polygon
- [ ] Test non-adjacent zones remain separate
- [ ] Test chain of adjacent zones all merge together
- [ ] Test zones touching at a single point
- [ ] Test zones with gaps smaller than tolerance

### Complex Scenarios
- [ ] Test merging creates holes when zones surround empty space
- [ ] Test multiple separate groups merge correctly
- [ ] Test deselecting a zone splits merged groups appropriately
- [ ] Test re-selecting a zone re-merges correctly

### Edge Cases
- [ ] Test zones with very complex boundaries
- [ ] Test zones with holes (donuts)
- [ ] Test MultiPolygon inputs (islands)
- [ ] Test precision issues with coordinates
- [ ] Test performance with 100+ zones

### Visual Test Scenarios
```typescript
describe('Visual merge scenarios', () => {
  it('should merge Paris arrondissements correctly', async () => {
    // Select Paris 1er
    await clickZone('paris-1');
    expect(getPolygonCount()).toBe(1);
    
    // Select adjacent Paris 2e
    await clickZone('paris-2');
    expect(getPolygonCount()).toBe(1); // Merged!
    
    // Select non-adjacent Paris 11e
    await clickZone('paris-11');
    expect(getPolygonCount()).toBe(2); // Separate polygons
    
    // Verify merge geometry is correct
    const merged = getMergedPolygons();
    expect(merged[0].properties.mergedZones).toEqual(['paris-1', 'paris-2']);
  });
});
```

## Performance Requirements

- Merge operation: < 200ms for 50 zones
- Adjacency detection: < 5ms per zone pair
- Use spatial indexing for O(n log n) instead of O(n²)
- Implement progressive merging for large selections

## Visual Feedback

- Merged zones should display as single polygon
- Smooth transition animation when merging
- Different border style for merged vs single zones
- Hover shows all merged zone names

## Algorithm Optimization

```typescript
// Use spatial index for performance
import { SpatialIndex } from './spatialIndex';

class MergeOptimizer {
  private index: SpatialIndex;
  
  constructor(zones: Zone[]) {
    this.index = new SpatialIndex(zones);
  }
  
  findAdjacentZones(zone: Zone): Zone[] {
    // Use R-tree or similar for fast lookup
    const candidates = this.index.query(zone.bbox);
    return candidates.filter(c => detectAdjacency(zone, c));
  }
}
```

## Error Handling

- Invalid geometries should be repaired or skipped
- Merge failures should not crash the application
- Provide user feedback for merge issues
- Log detailed errors for debugging

## Notes

- Use Turf.js union operation for actual merging
- Consider using turf.simplify for performance
- Preserve original zone data for undo functionality
- Test with real-world city boundary data
- Consider WebAssembly for performance-critical parts

## Related Issues

- #10: Uses geographic utilities for operations
- #6: ZoneLayer must render merged polygons
- #11: Comprehensive testing infrastructure