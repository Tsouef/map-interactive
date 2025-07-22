# Issue #3: Configure Test Environment with Leaflet Mocks

**Labels**: testing, configuration, leaflet, high-priority

## Description

Set up a comprehensive testing environment with proper Leaflet and react-leaflet mocks, ensuring tests can run without actual map rendering while maintaining realistic behavior.

## Acceptance Criteria

- [ ] Jest configured for React and TypeScript
- [ ] Leaflet and react-leaflet properly mocked
- [ ] leaflet-draw mocked for drawing tools
- [ ] Tests run without DOM/Canvas errors
- [ ] Map events can be simulated
- [ ] GeoJSON operations testable
- [ ] Coverage reporting configured

## Technical Implementation

### Jest Configuration
```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^leaflet$': '<rootDir>/__mocks__/leaflet.ts',
    '^react-leaflet$': '<rootDir>/__mocks__/react-leaflet.tsx',
    '^leaflet-draw$': '<rootDir>/__mocks__/leaflet-draw.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Leaflet Mock
```typescript
// __mocks__/leaflet.ts
const L = {
  map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    setView: jest.fn(),
    getZoom: jest.fn(() => 10),
    getBounds: jest.fn(() => ({
      getNorth: jest.fn(() => 50),
      getSouth: jest.fn(() => 40),
      getEast: jest.fn(() => 10),
      getWest: jest.fn(() => 0)
    })),
    fitBounds: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
    createPane: jest.fn(),
    getPane: jest.fn()
  })),
  
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn()
  })),
  
  geoJSON: jest.fn((data, options) => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    clearLayers: jest.fn(),
    addData: jest.fn(),
    setStyle: jest.fn(),
    eachLayer: jest.fn((callback) => {
      // Simulate layers
      const mockLayer = {
        feature: data,
        setStyle: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      callback(mockLayer);
    }),
    getLayers: jest.fn(() => []),
    getBounds: jest.fn(() => L.latLngBounds())
  })),
  
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  
  latLngBounds: jest.fn(() => ({
    extend: jest.fn(),
    getNorth: jest.fn(() => 50),
    getSouth: jest.fn(() => 40),
    getEast: jest.fn(() => 10),
    getWest: jest.fn(() => 0),
    isValid: jest.fn(() => true)
  })),
  
  control: {
    zoom: jest.fn(() => ({ addTo: jest.fn() })),
    scale: jest.fn(() => ({ addTo: jest.fn() }))
  },
  
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn()
  },
  
  Browser: {
    mobile: false,
    touch: false
  }
};

export default L;
```

### React-Leaflet Mock
```tsx
// __mocks__/react-leaflet.tsx
import React from 'react';

export const MapContainer = ({ children, ...props }: any) => (
  <div data-testid="map-container" {...props}>
    {children}
  </div>
);

export const TileLayer = ({ url, attribution }: any) => (
  <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
);

export const GeoJSON = ({ data, style, onEachFeature, eventHandlers }: any) => (
  <div 
    data-testid="geojson-layer" 
    data-features={JSON.stringify(data)}
    onClick={eventHandlers?.click}
    onMouseOver={eventHandlers?.mouseover}
    onMouseOut={eventHandlers?.mouseout}
  />
);

export const Polygon = ({ positions, ...props }: any) => (
  <div data-testid="polygon" data-positions={JSON.stringify(positions)} {...props} />
);

export const useMap = () => ({
  setView: jest.fn(),
  fitBounds: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getZoom: jest.fn(() => 10),
  getBounds: jest.fn(() => ({
    getNorth: jest.fn(() => 50),
    getSouth: jest.fn(() => 40),
    getEast: jest.fn(() => 10),
    getWest: jest.fn(() => 0)
  }))
});

export const useMapEvents = (handlers: any) => {
  return null;
};
```

### Leaflet-Draw Mock
```typescript
// __mocks__/leaflet-draw.ts
export const Draw = {
  Polygon: jest.fn(),
  Rectangle: jest.fn(),
  Circle: jest.fn(),
  Marker: jest.fn(),
  CircleMarker: jest.fn(),
  Polyline: jest.fn()
};

export const EditToolbar = {
  Edit: jest.fn(),
  Delete: jest.fn()
};

export const DrawEvents = {
  CREATED: 'draw:created',
  EDITED: 'draw:edited',
  DELETED: 'draw:deleted',
  DRAWSTART: 'draw:drawstart',
  DRAWSTOP: 'draw:drawstop',
  DRAWVERTEX: 'draw:drawvertex',
  EDITSTART: 'draw:editstart',
  EDITMOVE: 'draw:editmove',
  EDITRESIZE: 'draw:editresize',
  EDITVERTEX: 'draw:editvertex',
  EDITSTOP: 'draw:editstop',
  DELETESTART: 'draw:deletestart',
  DELETESTOP: 'draw:deletestop'
};
```

### Test Setup File
```typescript
// jest.setup.ts
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

## Testing Utilities

### Map Event Simulation
```typescript
// tests/utils/mapTestUtils.ts
import { fireEvent } from '@testing-library/react';

export const simulateMapClick = (element: HTMLElement, lat: number, lng: number) => {
  fireEvent.click(element, {
    latlng: { lat, lng },
    originalEvent: { preventDefault: jest.fn() }
  });
};

export const simulateZoneHover = (element: HTMLElement, zoneId: string) => {
  fireEvent.mouseOver(element, {
    target: { feature: { properties: { id: zoneId } } }
  });
};

export const createMockGeoJSON = (id: string, coordinates: number[][][]) => ({
  type: 'Feature',
  properties: { id, name: `Zone ${id}` },
  geometry: {
    type: 'Polygon',
    coordinates
  }
});
```

## Example Test
```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { LeafletZoneSelector } from '@/components/LeafletZoneSelector';
import { simulateMapClick } from '../utils/mapTestUtils';

describe('LeafletZoneSelector', () => {
  it('should render map container', () => {
    render(<LeafletZoneSelector />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should handle zone selection', () => {
    const onSelectionChange = jest.fn();
    render(<LeafletZoneSelector onSelectionChange={onSelectionChange} />);
    
    const geoJsonLayer = screen.getByTestId('geojson-layer');
    simulateMapClick(geoJsonLayer, 48.8566, 2.3522);
    
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          selected: true
        })
      ])
    );
  });
});
```

## CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pnpm test --coverage
    pnpm test:integration
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Related Issues

- #1: TypeScript configuration
- #32: Write unit tests for utilities
- #33: Create component integration tests