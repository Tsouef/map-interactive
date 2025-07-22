import React from "react";

interface MockComponentProps {
  children?: React.ReactNode;
  [key: string]: unknown;
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

interface GeoJSONProps extends MockComponentProps {
  data?: unknown;
  eventHandlers?: {
    click?: () => void;
    [key: string]: (() => void) | undefined;
  };
}

export const GeoJSON: React.FC<GeoJSONProps> = ({
  data,
  eventHandlers,
  ...props
}) => {
  return (
    <div data-testid="geojson-layer" data-geojson={JSON.stringify(data)} onClick={eventHandlers?.click} {...props} />
  );
};

interface PolygonProps extends MockComponentProps {
  positions?: number[][];
  eventHandlers?: {
    click?: () => void;
    [key: string]: (() => void) | undefined;
  };
}

export const Polygon: React.FC<PolygonProps> = ({
  positions,
  eventHandlers,
  ...props
}) => {
  return (
    <div data-testid="polygon" data-positions={JSON.stringify(positions)} onClick={eventHandlers?.click} {...props} />
  );
};

interface MarkerProps extends MockComponentProps {
  position?: [number, number];
}

export const Marker: React.FC<MarkerProps> = ({ position, children, ...props }) => {
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

// Re-export hooks from separate file to avoid react-refresh warnings
export { useMap, useMapEvents } from './react-leaflet-hooks';

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
