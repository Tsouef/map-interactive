# Issue #10: Implement Core Geographic Utility Functions with OSM/Turf.js

**Labels**: feature, geographic, high-priority

## Description

Create a comprehensive set of geographic utility functions for the zone selector using only open-source libraries (Turf.js and OpenStreetMap data). No Mapbox dependencies allowed.

## Acceptance Criteria

- [ ] Area calculation for zones (km²)
- [ ] Perimeter calculation for zones (km)
- [ ] Centroid calculation for zones
- [ ] Bounding box calculation
- [ ] Point-in-polygon detection
- [ ] Distance calculations between zones
- [ ] Coordinate transformation utilities
- [ ] GeoJSON validation and normalization
- [ ] OSM data fetching utilities

## Implementation Details

### Core Utilities (`geoUtils.ts`)
```typescript
import * as turf from '@turf/turf';

export function calculateArea(zone: Zone): number {
  // Use turf.area for calculation
}

export function calculatePerimeter(zone: Zone): number {
  // Use turf.length with turf.polygonToLine
}

export function getCentroid(zone: Zone): Coordinates {
  // Use turf.centroid
}

export function getBoundingBox(zone: Zone): BBox {
  // Use turf.bbox
}

export function isPointInZone(point: Coordinates, zone: Zone): boolean {
  // Use turf.booleanPointInPolygon
}
```

### OSM Data Utilities (`osmUtils.ts`)
```typescript
// Fetch city boundaries from OpenStreetMap
export async function fetchCityBoundary(cityName: string): Promise<Zone> {
  // Use Overpass API
}

// Search locations using Nominatim
export async function searchLocation(query: string): Promise<SearchResult[]> {
  // Use Nominatim API (free OSM geocoding)
}

// Cache OSM data locally
export class OSMCache {
  // Implement caching to reduce API calls
}
```

## Integration Tests Required

**IMPORTANT: No commits should be made before all tests pass and are validated.**

### Geographic Calculations
- [ ] Test area calculation accuracy with known zones
- [ ] Test perimeter calculation with various polygon shapes
- [ ] Test centroid calculation for regular and irregular polygons
- [ ] Test bounding box for single and multi-polygons
- [ ] Test point-in-polygon for edge cases

### OSM Integration
- [ ] Test fetching city boundaries from Overpass API
- [ ] Test Nominatim search with various queries
- [ ] Test cache functionality
- [ ] Test rate limiting compliance
- [ ] Test error handling for API failures

## Testing Data
```typescript
// Use real OSM data for tests
const PARIS_1ER = {
  id: 'paris-1',
  name: 'Paris 1er Arrondissement',
  coordinates: // Fetch from OSM
};

const MANHATTAN = {
  id: 'manhattan',
  name: 'Manhattan',
  coordinates: // Fetch from OSM
};
```

## Performance Requirements

- Area/perimeter calculations: < 10ms for typical zones
- OSM API calls: Implement caching to minimize requests
- Batch operations: Support processing multiple zones efficiently

## Dependencies

```json
{
  "dependencies": {
    "@turf/turf": "^6.5.0"
  }
}
```

## API Limits and Guidelines

- Nominatim: Max 1 request per second
- Overpass: Be respectful of server resources
- Always include User-Agent header
- Implement exponential backoff for retries

## Notes

- All geographic operations must use Turf.js
- No Mapbox GL JS geocoding or utilities
- Implement proper error handling for API failures
- Consider offline fallbacks for common cities
- Add attribution for OpenStreetMap data

## Related Issues

- #7: Search component will use these utilities
- #4: Polygon merging depends on adjacency detection
- #12: Import/Export will use GeoJSON utilities