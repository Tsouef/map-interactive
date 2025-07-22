export class Map {
  constructor() {
    return {
      on: jest.fn(),
      off: jest.fn(),
      remove: jest.fn(),
      addControl: jest.fn(),
      removeControl: jest.fn(),
      getCanvas: jest.fn(() => ({ style: {} })),
      getContainer: jest.fn(() => ({ style: {} })),
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
    };
  }
}

export class NavigationControl {
  onAdd = jest.fn();
  onRemove = jest.fn();
}

export class GeolocateControl {
  onAdd = jest.fn();
  onRemove = jest.fn();
}

export class Marker {
  setLngLat = jest.fn().mockReturnThis();
  addTo = jest.fn().mockReturnThis();
  remove = jest.fn();
}

export class Popup {
  setLngLat = jest.fn().mockReturnThis();
  setHTML = jest.fn().mockReturnThis();
  addTo = jest.fn().mockReturnThis();
  remove = jest.fn();
}

export const supported = jest.fn(() => true);

export default {
  Map,
  NavigationControl,
  GeolocateControl,
  Marker,
  Popup,
  supported,
};