# Issue #11: Set Up Comprehensive Unit and Integration Testing Infrastructure

**Labels**: high-priority, infrastructure, testing

## Description

Establish a robust testing infrastructure with Jest and React Testing Library, with a strong emphasis on integration tests. Every feature must have comprehensive integration tests before any commits are made.

## Acceptance Criteria

- [ ] Jest configured for TypeScript
- [ ] React Testing Library set up
- [ ] Integration test suite for all components
- [ ] Leaflet mocking strategy implemented
- [ ] OSM API mocking for tests
- [ ] Coverage requirements enforced (90%+)
- [ ] Visual regression testing (optional)
- [ ] Performance benchmarking tests
- [ ] Accessibility testing automation

## Testing Structure

```
tests/
├── unit/
│   ├── utils/
│   ├── hooks/
│   └── components/
├── integration/
│   ├── zone-selection/
│   │   ├── click-selection.test.tsx
│   │   ├── polygon-merging.test.tsx
│   │   └── multi-selection.test.tsx
│   ├── search/
│   │   ├── city-search.test.tsx
│   │   └── postal-code-search.test.tsx
│   ├── drawing/
│   │   └── custom-zone-drawing.test.tsx
│   └── data/
│       ├── osm-integration.test.tsx
│       └── import-export.test.tsx
└── e2e/
    └── full-workflow.test.tsx
```

## Integration Test Requirements

**CRITICAL: No code should be committed without passing integration tests!**

### Core Integration Tests

#### 1. Zone Selection Tests
```typescript
describe('Zone Selection Integration', () => {
  it('should show polygon when clicking on a city', async () => {
    render(<LeafletZoneSelector />);
    
    // Wait for map to load
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeInTheDocument());
    
    // Click on Paris
    const parisZone = await screen.findByTestId('zone-paris');
    fireEvent.click(parisZone);
    
    // Verify polygon appears
    expect(screen.getByTestId('zone-polygon-paris')).toBeInTheDocument();
    expect(screen.getByTestId('zone-polygon-paris')).toHaveClass('selected');
  });

  it('should merge adjacent zones automatically', async () => {
    render(<LeafletZoneSelector />);
    
    // Select two adjacent zones
    fireEvent.click(await screen.findByTestId('zone-paris-1'));
    fireEvent.click(await screen.findByTestId('zone-paris-2'));
    
    // Verify single merged polygon
    const polygons = screen.getAllByTestId(/zone-polygon/);
    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveAttribute('data-merged-zones', 'paris-1,paris-2');
  });
});
```

#### 2. Search Integration Tests
```typescript
describe('Search Integration with Nominatim', () => {
  it('should find and select city via search', async () => {
    render(<LeafletZoneSelector />);
    
    const searchInput = screen.getByPlaceholderText('Search city or postal code');
    
    // Type city name
    await userEvent.type(searchInput, 'Paris');
    
    // Wait for autocomplete results
    await waitFor(() => 
      expect(screen.getByText('Paris, France')).toBeInTheDocument()
    );
    
    // Select result
    fireEvent.click(screen.getByText('Paris, France'));
    
    // Verify map centers on Paris and shows zones
    expect(mockMapInstance.setView).toHaveBeenCalledWith([48.8566, 2.3522], expect.any(Number));
  });
});
```

#### 3. Drawing Tools Integration
```typescript
describe('Drawing Tools Integration', () => {
  it('should create custom zone via drawing', async () => {
    render(<LeafletZoneSelector enableDrawing />);
    
    // Activate polygon drawing
    fireEvent.click(screen.getByTestId('draw-polygon-button'));
    
    // Simulate drawing points
    const map = screen.getByTestId('map-container');
    fireEvent.click(map, { clientX: 100, clientY: 100 });
    fireEvent.click(map, { clientX: 200, clientY: 100 });
    fireEvent.click(map, { clientX: 200, clientY: 200 });
    fireEvent.click(map, { clientX: 100, clientY: 100 }); // Close polygon
    
    // Verify custom zone created
    expect(screen.getByTestId('custom-zone-1')).toBeInTheDocument();
  });
});
```

## Mocking Strategy

### Leaflet Mocking
```typescript
// __mocks__/leaflet.ts
export const mockMap = {
  on: jest.fn(),
  setView: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  // ... other methods
};

export const L = {
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
  geoJSON: jest.fn(() => ({ addTo: jest.fn() })),
  // ... other classes
};
```

### OSM API Mocking
```typescript
// __mocks__/osmApi.ts
export const mockNominatimSearch = jest.fn().mockResolvedValue([
  {
    place_id: 123,
    display_name: 'Paris, France',
    lat: '48.8566',
    lon: '2.3522'
  }
]);

export const mockOverpassQuery = jest.fn().mockResolvedValue({
  elements: [/* mock city boundary data */]
});
```

## Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
```

## Performance Tests

```typescript
describe('Performance Benchmarks', () => {
  it('should merge 50 zones in under 200ms', async () => {
    const zones = generateMockZones(50);
    
    const start = performance.now();
    const merged = mergeAdjacentZones(zones);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
});
```

## Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('should be keyboard navigable', async () => {
    render(<LeafletZoneSelector />);
    
    // Tab to first zone
    await userEvent.tab();
    expect(screen.getByTestId('zone-paris-1')).toHaveFocus();
    
    // Select with Enter
    await userEvent.keyboard('{Enter}');
    expect(screen.getByTestId('zone-paris-1')).toHaveClass('selected');
  });

  it('should announce zone selection to screen readers', async () => {
    render(<LeafletZoneSelector />);
    
    fireEvent.click(screen.getByTestId('zone-paris-1'));
    
    expect(screen.getByRole('status')).toHaveTextContent('Paris 1er selected');
  });
});
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Data Management

```typescript
// tests/fixtures/cityData.ts
export const PARIS_DISTRICTS = {
  'paris-1': { /* real OSM data */ },
  'paris-2': { /* real OSM data */ },
  // ...
};

// Use real data in tests for accuracy
```

## Notes

- **IMPORTANT**: Every PR must include integration tests
- No commits without test validation
- Use real OSM data in fixtures when possible
- Mock external APIs to avoid rate limits
- Consider visual regression testing with Percy
- Add performance benchmarks for critical paths

## Related Issues

- All feature issues require integration tests
- #4: Polygon merging tests
- #6: Zone layer interaction tests
- #7: Search component tests