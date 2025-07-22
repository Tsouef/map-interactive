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
  
  geoJSON: jest.fn((data) => ({
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