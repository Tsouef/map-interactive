/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
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

export const useMapEvents = (_handlers: any) => {
  return null;
};
