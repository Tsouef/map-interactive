# Issue #7: Implement Search Input Component with Nominatim (OSM) Autocomplete

**Labels**: accessibility, component, feature, medium-priority, ui

## Description

Create a search input component with autocomplete functionality for finding cities and postal codes using the free Nominatim API (OpenStreetMap) instead of Mapbox Geocoding.

## Acceptance Criteria

- [ ] Search input with debounced autocomplete
- [ ] Support for city names in multiple languages
- [ ] Support for postal code formats worldwide
- [ ] Keyboard navigation (arrow keys, enter, escape)
- [ ] Screen reader accessible
- [ ] Loading and error states
- [ ] Clear button functionality
- [ ] Recent searches (optional)
- [ ] Mobile-friendly interface

## Technical Implementation

### Component Structure
```typescript
interface SearchInputProps {
  onLocationSelect: (location: NominatimResult) => void;
  placeholder?: string;
  debounceMs?: number;
  maxResults?: number;
  className?: string;
  disabled?: boolean;
}

interface NominatimResult {
  place_id: number;
  osm_type: 'way' | 'relation' | 'node';
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  type: string;
  importance: number;
}
```

### API Integration
```typescript
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

async function searchLocations(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    'accept-language': navigator.language
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      'User-Agent': 'LeafletZoneSelector/1.0'
    }
  });

  // Rate limiting: Max 1 request per second
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return response.json();
}
```

### Postal Code Validation
```typescript
const POSTAL_PATTERNS = {
  US: /^\d{5}(-\d{4})?$/,
  UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  FR: /^\d{5}$/,
  DE: /^\d{5}$/,
  CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
  JP: /^\d{3}-\d{4}$/,
  // Add more patterns
};
```

## Integration Tests Required

**IMPORTANT: No commits should be made before all tests pass and are validated.**

### Functional Tests
- [ ] Test search with city names returns correct results
- [ ] Test search with postal codes returns correct results
- [ ] Test debouncing works correctly (only one API call after typing)
- [ ] Test selecting a result triggers callback with correct data
- [ ] Test clearing search resets component state

### API Integration Tests
- [ ] Test Nominatim API integration with real queries
- [ ] Test rate limiting compliance (1 req/sec)
- [ ] Test error handling for API failures
- [ ] Test handling of no results
- [ ] Test international character support

### Accessibility Tests
- [ ] Test keyboard navigation through results
- [ ] Test screen reader announcements
- [ ] Test focus management
- [ ] Test ARIA attributes
- [ ] Test high contrast mode

### UI/UX Tests
- [ ] Test loading state appears during search
- [ ] Test error messages for failed searches
- [ ] Test clear button functionality
- [ ] Test mobile touch interactions
- [ ] Test responsive design

## Styling Requirements

```css
.search-input-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px; /* Prevents zoom on iOS */
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover,
.search-result-item[aria-selected="true"] {
  background-color: var(--hover-bg);
}
```

## Performance Considerations

- Debounce search input (default: 300ms)
- Cache recent searches in memory
- Limit autocomplete results (default: 5)
- Implement virtual scrolling for long result lists
- Use React.memo to prevent unnecessary re-renders

## Error Handling

```typescript
enum SearchError {
  RATE_LIMIT = 'Please wait before searching again',
  NETWORK = 'Unable to connect to search service',
  NO_RESULTS = 'No locations found',
  INVALID_QUERY = 'Please enter at least 3 characters'
}
```

## Notes

- Must include proper attribution for OpenStreetMap/Nominatim
- No API key required (it's free!)
- Respect Nominatim usage policy
- Consider implementing local caching for common searches
- Add analytics to track search patterns

## Related Issues

- #10: Uses geographic utilities for coordinate handling
- #11: Testing infrastructure for integration tests
- #15: Accessibility requirements