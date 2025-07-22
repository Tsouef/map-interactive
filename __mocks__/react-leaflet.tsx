import React from 'react';
import { mockMap, mockTileLayer, mockGeoJSON } from './leaflet';

export const MapContainer = ({ children, ...props }: any) => {
  return (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  );
};

export const TileLayer = ({ url, ...props }: any) => {
  return <div data-testid="tile-layer" data-url={url} {...props} />;
};

export const GeoJSON = ({ data, eventHandlers, style, ...props }: any) => {
  return (
    <div
      data-testid="geojson-layer"
      data-geojson={JSON.stringify(data)}
      onClick={eventHandlers?.click}
      {...props}
    />
  );
};

export const Polygon = ({ positions, eventHandlers, ...props }: any) => {
  return (
    <div
      data-testid="polygon"
      data-positions={JSON.stringify(positions)}
      onClick={eventHandlers?.click}
      {...props}
    />
  );
};

export const Marker = ({ position, children, ...props }: any) => {
  return (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      {...props}
    >
      {children}
    </div>
  );
};

export const Popup = ({ children, ...props }: any) => {
  return (
    <div data-testid="popup" {...props}>
      {children}
    </div>
  );
};

export const useMap = () => mockMap;
export const useMapEvents = (handlers: any) => {
  // Mock implementation - just return the mock map
  Object.keys(handlers).forEach((event) => {
    mockMap.on(event, handlers[event]);
  });
  return mockMap;
};

export const LayersControl = ({ children, ...props }: any) => {
  return (
    <div data-testid="layers-control" {...props}>
      {children}
    </div>
  );
};

export const LayersControlBaseLayer = ({ children, name, ...props }: any) => {
  return (
    <div data-testid={`base-layer-${name}`} {...props}>
      {children}
    </div>
  );
};

export const LayersControlOverlay = ({ children, name, ...props }: any) => {
  return (
    <div data-testid={`overlay-${name}`} {...props}>
      {children}
    </div>
  );
};