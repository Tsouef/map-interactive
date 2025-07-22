import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeafletZoneSelector } from '../LeafletZoneSelector';
import { EnhancedTileLayer } from '../../TileLayer';

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  MapContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-container" {...props}>{children}</div>
  ),
  useMap: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    setView: jest.fn(),
    fitBounds: jest.fn(),
    getZoom: jest.fn(() => 10)
  }))
}));

// Mock our custom components
jest.mock('../../TileLayer', () => ({
  EnhancedTileLayer: jest.fn(({ provider, theme }: { provider: string | object; theme?: string }) => (
    <div 
      data-testid="enhanced-tile-layer" 
      data-provider={provider}
      data-theme={theme}
    />
  ))
}));

jest.mock('../../ZoneLayer', () => ({
  ZoneLayer: jest.fn(() => <div data-testid="zone-layer" />)
}));

jest.mock('../../SearchInput', () => ({
  SearchInput: jest.fn(() => <div data-testid="search-input" />)
}));

jest.mock('../../DrawingTools', () => ({
  DrawingTools: jest.fn(() => <div data-testid="drawing-tools" />)
}));

jest.mock('../../LoadingOverlay', () => ({
  LoadingOverlay: jest.fn(() => <div data-testid="loading-overlay" />)
}));

jest.mock('../../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('LeafletZoneSelector - Tile Layer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with EnhancedTileLayer', () => {
    render(<LeafletZoneSelector />);
    
    expect(screen.getByTestId('enhanced-tile-layer')).toBeInTheDocument();
  });

  it('should pass default tile provider to EnhancedTileLayer', () => {
    render(<LeafletZoneSelector />);
    
    const tileLayer = screen.getByTestId('enhanced-tile-layer');
    // Default theme is 'light', which uses cartoDB
    expect(tileLayer).toHaveAttribute('data-provider', 'cartoDB');
  });

  it('should pass tile provider based on theme', () => {
    render(<LeafletZoneSelector theme="dark" />);
    
    const tileLayer = screen.getByTestId('enhanced-tile-layer');
    expect(tileLayer).toHaveAttribute('data-provider', 'cartoDBDark');
  });

  it('should pass light theme tile provider', () => {
    render(<LeafletZoneSelector theme="light" />);
    
    const tileLayer = screen.getByTestId('enhanced-tile-layer');
    expect(tileLayer).toHaveAttribute('data-provider', 'cartoDB');
  });

  it('should allow custom tile provider', () => {
    render(<LeafletZoneSelector tileProvider="stamen" />);
    
    const tileLayer = screen.getByTestId('enhanced-tile-layer');
    expect(tileLayer).toHaveAttribute('data-provider', 'stamen');
  });

  it('should pass custom tile provider object', () => {
    const customProvider = {
      name: 'Custom',
      url: 'https://custom.tiles.com/{z}/{x}/{y}.png',
      attribution: 'Custom',
      maxZoom: 20
    };
    
    render(<LeafletZoneSelector tileProvider={customProvider} />);
    
    // Get the last call
    const lastCall = (EnhancedTileLayer as jest.Mock).mock.calls.slice(-1)[0];
    expect(lastCall[0].provider).toEqual(customProvider);
  });

  it('should configure tile error callbacks', () => {
    const onTileError = jest.fn();
    render(<LeafletZoneSelector onTileError={onTileError} />);
    
    const lastCall = (EnhancedTileLayer as jest.Mock).mock.calls.slice(-1)[0];
    expect(lastCall[0].onTileError).toBe(onTileError);
  });

  it('should use fallback provider', () => {
    render(<LeafletZoneSelector fallbackTileProvider="openstreetmap" />);
    
    const lastCall = (EnhancedTileLayer as jest.Mock).mock.calls.slice(-1)[0];
    expect(lastCall[0].fallbackProvider).toBe('openstreetmap');
  });
});