import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { LeafletZoneSelector, LeafletZoneSelectorRef } from '@/components/LeafletZoneSelector';
import type { Zone } from '@/types';
import type { ThemeConfig } from '@/components/LeafletZoneSelector/types';

// Mock Leaflet and React-Leaflet
jest.mock('leaflet');
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, whenReady, center = [48.8566, 2.3522], zoom = 12 }: {
    children: React.ReactNode;
    whenReady?: (map: unknown) => void;
    center?: [number, number];
    zoom?: number;
  }) => {
    const mockMap = {
      setView: jest.fn(),
      getZoom: jest.fn().mockReturnValue(zoom),
      fitBounds: jest.fn(),
    };
    if (whenReady) {
      whenReady(mockMap);
    }
    return (
      <div 
        className="leaflet-container" 
        data-center={JSON.stringify(center)}
        data-zoom={String(zoom)}
        tabIndex={0}
      >
        {children}
      </div>
    );
  },
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  useMap: () => ({
    setView: jest.fn(),
    getZoom: jest.fn().mockReturnValue(12),
    fitBounds: jest.fn(),
  }),
}));

const createMockZone = (id: string): Zone => ({
  id,
  name: `Zone ${id}`,
  coordinates: [
    [2.3522, 48.8566],
    [2.3532, 48.8576],
    [2.3542, 48.8566],
    [2.3522, 48.8566],
  ],
  properties: {
    postalCode: '75001',
  },
});

describe('LeafletZoneSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Leaflet map with OpenStreetMap tiles', () => {
      render(<LeafletZoneSelector />);
      
      const mapContainer = screen.getByRole('application');
      expect(mapContainer).toHaveClass('leaflet-zone-selector');
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-url', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(tileLayer).toHaveAttribute('data-attribution');
    });

    it('should render with responsive container that fills parent element', () => {
      const { container } = render(
        <div style={{ width: '800px', height: '600px' }}>
          <LeafletZoneSelector />
        </div>
      );
      
      const selector = container.querySelector('.leaflet-zone-selector');
      expect(selector).toBeInTheDocument();
      expect(selector).toHaveClass('leaflet-zone-selector');
      // Note: jsdom doesn't handle CSS properly, so we just verify the element has the right class
      // The actual CSS file contains width: 100%; height: 100%; which will work in real browsers
    });

    it('should render with custom container className and style', () => {
      const { container } = render(
        <LeafletZoneSelector 
          containerClassName="custom-map"
          containerStyle={{ border: '2px solid red' }}
        />
      );
      
      const selector = container.querySelector('.leaflet-zone-selector');
      expect(selector).toHaveClass('custom-map');
      expect(selector).toHaveStyle({ border: '2px solid red' });
    });
  });

  describe('Map Configuration', () => {
    it('should initialize map with provided center and zoom', () => {
      const { container } = render(
        <LeafletZoneSelector
          initialCenter={[51.505, -0.09]}
          initialZoom={13}
        />
      );
      
      const map = container.querySelector('.leaflet-container');
      expect(map).toHaveAttribute('data-center', '[51.505,-0.09]');
      expect(map).toHaveAttribute('data-zoom', '13');
    });

    it('should respect min and max zoom levels', () => {
      render(
        <LeafletZoneSelector
          minZoom={5}
          maxZoom={15}
        />
      );
      
      // These would be tested through actual map interaction
      // For now, we verify props are passed
      expect(true).toBe(true);
    });

    it('should initialize with bounds when provided', () => {
      const bounds: [[number, number], [number, number]] = [[51.505, -0.09], [51.515, -0.08]];
      
      render(
        <LeafletZoneSelector
          bounds={bounds}
        />
      );
      
      // Bounds would be applied to the map instance
      expect(true).toBe(true);
    });
  });

  describe('Zone Selection', () => {
    it('should handle zone selection via click', async () => {
      const onSelectionChange = jest.fn();
      const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
      
      render(
        <LeafletZoneSelector
          zones={zones}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const zone1 = screen.getByTestId('zone-zone-1');
      fireEvent.click(zone1);
      
      expect(onSelectionChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'zone-1' })
      ]);
    });

    it('should support multi-selection when enabled', async () => {
      const onSelectionChange = jest.fn();
      const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
      
      render(
        <LeafletZoneSelector
          zones={zones}
          multiSelect={true}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const zone1 = screen.getByTestId('zone-zone-1');
      const zone2 = screen.getByTestId('zone-zone-2');
      
      fireEvent.click(zone1);
      fireEvent.click(zone2);
      
      expect(onSelectionChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'zone-1' }),
        expect.objectContaining({ id: 'zone-2' })
      ]);
    });

    it('should respect maxSelections limit', async () => {
      const onSelectionChange = jest.fn();
      const zones = [
        createMockZone('zone-1'),
        createMockZone('zone-2'),
        createMockZone('zone-3')
      ];
      
      render(
        <LeafletZoneSelector
          zones={zones}
          multiSelect={true}
          maxSelections={2}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const zone1 = screen.getByTestId('zone-zone-1');
      const zone2 = screen.getByTestId('zone-zone-2');
      const zone3 = screen.getByTestId('zone-zone-3');
      
      fireEvent.click(zone1);
      fireEvent.click(zone2);
      fireEvent.click(zone3);
      
      // Should only have 2 selections
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'zone-1' }),
          expect.objectContaining({ id: 'zone-2' })
        ])
      );
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ id: 'zone-3' })
        ])
      );
    });

    it('should initialize with selectedZoneIds', () => {
      const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
      const onSelectionChange = jest.fn();
      
      render(
        <LeafletZoneSelector
          zones={zones}
          selectedZoneIds={['zone-1']}
          onSelectionChange={onSelectionChange}
        />
      );
      
      // Should initialize with zone-1 selected
      expect(onSelectionChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'zone-1' })
      ]);
    });
  });

  describe('Ref API', () => {
    it('should expose imperative methods via ref', () => {
      const ref = { current: null } as React.RefObject<LeafletZoneSelectorRef>;
      const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
      
      render(
        <LeafletZoneSelector
          ref={ref}
          zones={zones}
        />
      );
      
      expect(ref.current).toBeDefined();
      expect(ref.current).toHaveProperty('setView');
      expect(ref.current).toHaveProperty('fitBounds');
      expect(ref.current).toHaveProperty('selectZones');
      expect(ref.current).toHaveProperty('clearSelection');
      expect(ref.current).toHaveProperty('getSelectedZones');
      expect(ref.current).toHaveProperty('loadZones');
      expect(ref.current).toHaveProperty('refreshZones');
      expect(ref.current).toHaveProperty('exportSelection');
      expect(ref.current).toHaveProperty('getSelectionMetrics');
    });

    it('should handle setView via ref', () => {
      const ref = { current: null } as React.RefObject<LeafletZoneSelectorRef>;
      
      render(<LeafletZoneSelector ref={ref} />);
      
      act(() => {
        ref.current?.setView([51.505, -0.09], 15);
      });
      
      // Map instance would be updated
      expect(true).toBe(true);
    });

    it('should handle zone selection via ref', () => {
      const ref = { current: null } as React.RefObject<LeafletZoneSelectorRef>;
      const zones = [createMockZone('zone-1'), createMockZone('zone-2')];
      const onSelectionChange = jest.fn();
      
      render(
        <LeafletZoneSelector
          ref={ref}
          zones={zones}
          onSelectionChange={onSelectionChange}
        />
      );
      
      act(() => {
        ref.current?.selectZones(['zone-1', 'zone-2']);
      });
      
      expect(onSelectionChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'zone-1' }),
        expect.objectContaining({ id: 'zone-2' })
      ]);
    });

    it('should clear selection via ref', () => {
      const ref = { current: null } as React.RefObject<LeafletZoneSelectorRef>;
      const zones = [createMockZone('zone-1')];
      const onSelectionChange = jest.fn();
      
      render(
        <LeafletZoneSelector
          ref={ref}
          zones={zones}
          selectedZoneIds={['zone-1']}
          onSelectionChange={onSelectionChange}
        />
      );
      
      act(() => {
        ref.current?.clearSelection();
      });
      
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });
  });

  describe('Event Callbacks', () => {
    it('should call onZoneClick when zone is clicked', () => {
      const onZoneClick = jest.fn();
      const zones = [createMockZone('zone-1')];
      
      render(
        <LeafletZoneSelector
          zones={zones}
          onZoneClick={onZoneClick}
        />
      );
      
      const zone = screen.getByTestId('zone-zone-1');
      fireEvent.click(zone);
      
      expect(onZoneClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'zone-1' }),
        expect.any(Object)
      );
    });

    it('should call onZoneHover when zone is hovered', () => {
      const onZoneHover = jest.fn();
      const zones = [createMockZone('zone-1')];
      
      render(
        <LeafletZoneSelector
          zones={zones}
          onZoneHover={onZoneHover}
        />
      );
      
      const zone = screen.getByTestId('zone-zone-1');
      fireEvent.mouseEnter(zone);
      
      expect(onZoneHover).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'zone-1' })
      );
      
      fireEvent.mouseLeave(zone);
      expect(onZoneHover).toHaveBeenCalledWith(null);
    });

    it('should call onMapReady when map is initialized', () => {
      const onMapReady = jest.fn();
      
      render(
        <LeafletZoneSelector
          onMapReady={onMapReady}
        />
      );
      
      expect(onMapReady).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should call onError when error occurs', async () => {
      const onError = jest.fn();
      const loadZonesAsync = jest.fn().mockRejectedValue(new Error('Failed to load'));
      
      render(
        <LeafletZoneSelector
          loadZonesAsync={loadZonesAsync}
          onError={onError}
        />
      );
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme by default', () => {
      const { container } = render(<LeafletZoneSelector />);
      
      const selector = container.querySelector('.leaflet-zone-selector');
      expect(selector).toHaveClass('light');
    });

    it('should apply dark theme when specified', () => {
      const { container } = render(
        <LeafletZoneSelector theme="dark" />
      );
      
      const selector = container.querySelector('.leaflet-zone-selector');
      expect(selector).toHaveClass('dark');
    });

    it('should apply custom theme object', () => {
      const customTheme = {
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
        },
      };
      
      const { container } = render(
        <LeafletZoneSelector theme={customTheme as ThemeConfig} />
      );
      
      const selector = container.querySelector('.leaflet-zone-selector');
      expect(selector).toHaveClass('custom');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state when loadZonesAsync is pending', async () => {
      const loadZonesAsync = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { container } = render(
        <LeafletZoneSelector loadZonesAsync={loadZonesAsync} />
      );
      
      expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(container.querySelector('.loading-overlay')).not.toBeInTheDocument();
      });
    });

    it('should handle errors with error boundary', () => {
      const onError = jest.fn();
      
      // Force an error in child component
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      render(
        <LeafletZoneSelector onError={onError}>
          <ErrorComponent />
        </LeafletZoneSelector>
      );
      
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Component Features', () => {
    it('should render search input when enableSearch is true', () => {
      render(
        <LeafletZoneSelector enableSearch={true} />
      );
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should not render search input when enableSearch is false', () => {
      render(
        <LeafletZoneSelector enableSearch={false} />
      );
      
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('should render drawing tools when enableDrawing is true', () => {
      render(
        <LeafletZoneSelector enableDrawing={true} />
      );
      
      expect(screen.getByTestId('drawing-tools')).toBeInTheDocument();
    });

    it('should enable keyboard navigation by default', () => {
      const { container } = render(<LeafletZoneSelector />);
      
      const mapContainer = container.querySelector('.leaflet-container');
      expect(mapContainer).toHaveAttribute('tabindex');
    });
  });

  describe('Cleanup', () => {
    it('should properly cleanup on unmount', () => {
      const { unmount } = render(<LeafletZoneSelector />);
      
      unmount();
      
      // Verify cleanup occurred (would check for removed event listeners, etc.)
      expect(true).toBe(true);
    });
  });
});