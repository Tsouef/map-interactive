import React from "react";
import { mockMap } from "./leaflet";

interface MockComponentProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export const MapContainer: React.FC<MockComponentProps> = ({ children, ...props }) => {
  return (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  );
};

export const TileLayer: React.FC<MockComponentProps & { url?: string }> = ({ url, ...props }) => {
  return <div data-testid="tile-layer" data-url={url} {...props} />;
};

export const GeoJSON: React.FC<MockComponentProps & { data?: any; eventHandlers?: any }> = ({
  data,
  eventHandlers,
  ...props
}) => {
  return (
    <div data-testid="geojson-layer" data-geojson={JSON.stringify(data)} onClick={eventHandlers?.click} {...props} />
  );
};

export const Polygon: React.FC<MockComponentProps & { positions?: any; eventHandlers?: any }> = ({
  positions,
  eventHandlers,
  ...props
}) => {
  return (
    <div data-testid="polygon" data-positions={JSON.stringify(positions)} onClick={eventHandlers?.click} {...props} />
  );
};

export const Marker: React.FC<MockComponentProps & { position?: any }> = ({ position, children, ...props }) => {
  return (
    <div data-testid="marker" data-position={JSON.stringify(position)} {...props}>
      {children}
    </div>
  );
};

export const Popup: React.FC<MockComponentProps> = ({ children, ...props }) => {
  return (
    <div data-testid="popup" {...props}>
      {children}
    </div>
  );
};

export const useMap = () => mockMap;
export const useMapEvents = (handlers: Record<string, (...args: any[]) => void>) => {
  // Mock implementation - just return the mock map
  Object.keys(handlers).forEach((event) => {
    mockMap.on(event, handlers[event]);
  });
  return mockMap;
};

export const LayersControl: React.FC<MockComponentProps> = ({ children, ...props }) => {
  return (
    <div data-testid="layers-control" {...props}>
      {children}
    </div>
  );
};

interface NamedLayerProps extends MockComponentProps {
  name: string;
}

export const LayersControlBaseLayer: React.FC<NamedLayerProps> = ({ children, name, ...props }) => {
  return (
    <div data-testid={`base-layer-${name}`} {...props}>
      {children}
    </div>
  );
};

export const LayersControlOverlay: React.FC<NamedLayerProps> = ({ children, name, ...props }) => {
  return (
    <div data-testid={`overlay-${name}`} {...props}>
      {children}
    </div>
  );
};
