/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const mockMap = {
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  setView: jest.fn().mockReturnThis(),
  addLayer: jest.fn().mockReturnThis(),
  removeLayer: jest.fn().mockReturnThis(),
  hasLayer: jest.fn().mockReturnValue(false),
  getCenter: jest.fn().mockReturnValue({ lat: 48.8566, lng: 2.3522 }),
  getZoom: jest.fn().mockReturnValue(10),
  getBounds: jest.fn().mockReturnValue({
    getNorth: jest.fn().mockReturnValue(48.9),
    getSouth: jest.fn().mockReturnValue(48.8),
    getEast: jest.fn().mockReturnValue(2.4),
    getWest: jest.fn().mockReturnValue(2.3),
    contains: jest.fn().mockReturnValue(true),
  }),
  fitBounds: jest.fn().mockReturnThis(),
  panTo: jest.fn().mockReturnThis(),
  setZoom: jest.fn().mockReturnThis(),
  invalidateSize: jest.fn().mockReturnThis(),
  remove: jest.fn(),
  getContainer: jest.fn().mockReturnValue(document.createElement('div')),
  latLngToContainerPoint: jest.fn().mockReturnValue({ x: 100, y: 100 }),
  containerPointToLatLng: jest.fn().mockReturnValue({ lat: 48.8566, lng: 2.3522 }),
  project: jest.fn().mockReturnValue({ x: 100, y: 100 }),
  unproject: jest.fn().mockReturnValue({ lat: 48.8566, lng: 2.3522 }),
  _container: document.createElement('div'),
};

export const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  setUrl: jest.fn().mockReturnThis(),
  setOpacity: jest.fn().mockReturnThis(),
};

export const mockGeoJSON = {
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  clearLayers: jest.fn().mockReturnThis(),
  addData: jest.fn().mockReturnThis(),
  setStyle: jest.fn().mockReturnThis(),
  eachLayer: jest.fn((callback: any) => {
    // Mock some layers
    const mockLayers = [
      { feature: { properties: { id: 'zone-1' } }, setStyle: jest.fn() },
      { feature: { properties: { id: 'zone-2' } }, setStyle: jest.fn() },
    ];
    mockLayers.forEach(callback);
  }),
  getBounds: jest.fn().mockReturnValue({
    getNorth: jest.fn().mockReturnValue(48.9),
    getSouth: jest.fn().mockReturnValue(48.8),
    getEast: jest.fn().mockReturnValue(2.4),
    getWest: jest.fn().mockReturnValue(2.3),
  }),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
};

export const mockPolygon = {
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  setStyle: jest.fn().mockReturnThis(),
  getBounds: jest.fn().mockReturnValue({
    getNorth: jest.fn().mockReturnValue(48.9),
    getSouth: jest.fn().mockReturnValue(48.8),
    getEast: jest.fn().mockReturnValue(2.4),
    getWest: jest.fn().mockReturnValue(2.3),
  }),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  _latlngs: [[{ lat: 48.8566, lng: 2.3522 }]],
};

export const mockControl = {
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  getContainer: jest.fn().mockReturnValue(document.createElement('div')),
};

export const L = {
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  geoJSON: jest.fn(() => mockGeoJSON),
  geoJson: jest.fn(() => mockGeoJSON), // Some code might use lowercase
  polygon: jest.fn(() => mockPolygon),
  latLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
  latLngBounds: jest.fn(() => ({
    extend: jest.fn().mockReturnThis(),
    getNorth: jest.fn().mockReturnValue(48.9),
    getSouth: jest.fn().mockReturnValue(48.8),
    getEast: jest.fn().mockReturnValue(2.4),
    getWest: jest.fn().mockReturnValue(2.3),
    contains: jest.fn().mockReturnValue(true),
  })),
  control: jest.fn(() => mockControl),
  Control: {
    extend: jest.fn((options: any) => {
      return jest.fn(() => ({
        ...mockControl,
        ...options,
      }));
    }),
  },
  DomUtil: {
    create: jest.fn((tagName: string) => document.createElement(tagName)),
    remove: jest.fn(),
  },
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
  Browser: {
    mobile: false,
    touch: false,
  },
  Icon: {
    Default: {
      imagePath: '',
    },
  },
};

export default L;