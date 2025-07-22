import '@testing-library/jest-dom';

// Mock mapbox-gl to avoid issues in test environment
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    getCanvas: jest.fn(() => ({
      style: {},
    })),
    getContainer: jest.fn(() => ({
      style: {},
    })),
    resize: jest.fn(),
    project: jest.fn(() => ({ x: 100, y: 100 })),
    unproject: jest.fn(),
    getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
    getZoom: jest.fn(() => 10),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    flyTo: jest.fn(),
    panBy: jest.fn(),
    addSource: jest.fn(),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getLayer: jest.fn(),
    getSource: jest.fn(),
    queryRenderedFeatures: jest.fn(() => []),
    loaded: jest.fn(() => true),
    setPaintProperty: jest.fn(),
    setFeatureState: jest.fn(),
    removeFeatureState: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  GeolocateControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  })),
  Popup: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    setHTML: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  })),
  supported: jest.fn(() => true),
}));

// Mock leaflet-draw
jest.mock('leaflet-draw', () => {
  return {
    Draw: jest.fn(() => ({
      enable: jest.fn(),
      disable: jest.fn(),
      addHooks: jest.fn(),
      removeHooks: jest.fn(),
      setOptions: jest.fn(),
    })),
    drawLocal: {
      draw: {
        toolbar: {
          buttons: {},
        },
      },
    },
  };
});

// Add custom matchers or global test utilities here if needed
(globalThis as unknown as { ResizeObserver: jest.Mock }).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});