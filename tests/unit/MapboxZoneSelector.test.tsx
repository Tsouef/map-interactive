import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MapboxZoneSelector } from '../../src/components/MapboxZoneSelector';
import type { MapboxZoneSelectorRef } from '../../src/types';
import mapboxgl from 'mapbox-gl';

// Mock mapbox-gl is already set up in tests/setup.ts

describe('MapboxZoneSelector', () => {
  const mockMapboxToken = 'test-token-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the map container with correct dimensions', () => {
      const { container } = render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          height="600px"
          width="800px"
        />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer).toHaveStyle({ height: '600px', width: '800px' });
    });

    it('should use default dimensions when not specified', () => {
      const { container } = render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveStyle({ height: '100%', width: '100%' });
    });

    it('should handle numeric dimensions', () => {
      const { container } = render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          height={400}
          width={600}
        />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveStyle({ height: '400px', width: '600px' });
    });
  });

  describe('Map Initialization', () => {
    it('should initialize Mapbox with provided token', () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      expect(mapboxgl.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: mockMapboxToken,
        })
      );
    });

    it('should use default center (Paris) when not specified', () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      expect(mapboxgl.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          center: [2.3522, 48.8566],
          zoom: 10,
        })
      );
    });

    it('should use custom initial center and zoom', () => {
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          initialCenter={[-74.006, 40.7128]} // New York
          initialZoom={12}
        />
      );
      
      expect(mapboxgl.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          center: [-74.006, 40.7128],
          zoom: 12,
        })
      );
    });

    it('should use custom map style', () => {
      const customStyle = 'mapbox://styles/mapbox/dark-v11';
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          mapStyle={customStyle}
        />
      );
      
      expect(mapboxgl.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          style: customStyle,
        })
      );
    });

    it('should call onMapLoad callback when map is loaded', async () => {
      const onMapLoad = jest.fn();
      
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          onMapLoad={onMapLoad}
        />
      );
      
      // Simulate map load event
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const loadCallback = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, () => void])[0] === 'load'
      )?.[1];
      
      loadCallback?.();
      
      await waitFor(() => {
        expect(onMapLoad).toHaveBeenCalledWith(mapInstance);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid token gracefully', () => {
      const onError = jest.fn();
      
      render(
        <MapboxZoneSelector 
          mapboxToken=""
          onError={onError}
        />
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid Mapbox token'),
        })
      );
    });

    it('should display error message when map fails to initialize', () => {
      const onError = jest.fn();
      
      // Mock mapbox to throw error
      (mapboxgl.Map as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to initialize map');
      });
      
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          onError={onError}
        />
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to initialize map',
        })
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('ForwardRef Methods', () => {
    let ref: React.RefObject<MapboxZoneSelectorRef>;
    
    beforeEach(() => {
      ref = React.createRef<MapboxZoneSelectorRef>();
    });

    it('should expose getMap method', () => {
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
        />
      );
      
      expect(ref.current?.getMap).toBeDefined();
      expect(ref.current?.getMap()).toBeTruthy();
    });

    it('should expose selectZone method', async () => {
      const onSelectionChange = jest.fn();
      
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
          onSelectionChange={onSelectionChange}
        />
      );
      
      expect(ref.current?.selectZone).toBeDefined();
      
      // Select a zone
      ref.current?.selectZone('zone-1');
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalled();
      });
    });

    it('should expose clearSelection method', async () => {
      const onSelectionChange = jest.fn();
      
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
          onSelectionChange={onSelectionChange}
        />
      );
      
      // Select some zones first
      ref.current?.selectZone('zone-1');
      ref.current?.selectZone('zone-2');
      
      // Clear selection
      ref.current?.clearSelection();
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenLastCalledWith([], []);
      });
    });

    it('should expose getSelectedZones method', () => {
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
        />
      );
      
      expect(ref.current?.getSelectedZones).toBeDefined();
      expect(ref.current?.getSelectedZones()).toEqual([]);
      
      // Select zones and verify
      ref.current?.selectZone('zone-1');
      const selected = ref.current?.getSelectedZones();
      expect(selected).toHaveLength(1);
    });

    it('should expose exportSelection method', () => {
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
        />
      );
      
      expect(ref.current?.exportSelection).toBeDefined();
      
      // Test GeoJSON export
      const geojson = ref.current?.exportSelection('geojson');
      expect(geojson).toBeTruthy();
      expect(() => JSON.parse(geojson || '')).not.toThrow();
      
      // Test KML export
      const kml = ref.current?.exportSelection('kml');
      expect(kml).toContain('<?xml');
      
      // Test CSV export
      const csv = ref.current?.exportSelection('csv');
      expect(csv).toContain('id,name');
    });
  });

  describe('Zone Selection', () => {
    it('should handle single zone selection when multiSelect is false', async () => {
      const onSelectionChange = jest.fn();
      
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          multiSelect={false}
          onSelectionChange={onSelectionChange}
        />
      );
      
      // Simulate clicking on zones
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, (e: unknown) => void])[0] === 'click'
      )?.[1];
      
      // Click first zone
      clickHandler?.({
        lngLat: { lng: 2.3522, lat: 48.8566 },
        point: { x: 100, y: 100 },
      });
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
          expect.any(Array)
        );
      });
      
      // Click second zone (should replace first)
      clickHandler?.({
        lngLat: { lng: 2.4, lat: 48.9 },
        point: { x: 150, y: 150 },
      });
      
      await waitFor(() => {
        const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
        expect(lastCall[0]).toHaveLength(1); // Only one zone selected
      });
    });

    it('should handle multiple zone selection when multiSelect is true', async () => {
      const onSelectionChange = jest.fn();
      
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          multiSelect={true}
          onSelectionChange={onSelectionChange}
        />
      );
      
      // Simulate clicking on zones
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, (e: unknown) => void])[0] === 'click'
      )?.[1];
      
      // Click multiple zones
      clickHandler?.({ lngLat: { lng: 2.3522, lat: 48.8566 } });
      clickHandler?.({ lngLat: { lng: 2.4, lat: 48.9 } });
      
      await waitFor(() => {
        const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
        expect(lastCall[0]).toHaveLength(2); // Two zones selected
      });
    });

    it('should call onZoneClick callback', async () => {
      const onZoneClick = jest.fn();
      
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          onZoneClick={onZoneClick}
        />
      );
      
      // Simulate zone click
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, (e: unknown) => void])[0] === 'click'
      )?.[1];
      
      const mockEvent = {
        lngLat: { lng: 2.3522, lat: 48.8566 },
        point: { x: 100, y: 100 },
        originalEvent: new MouseEvent('click'),
        target: mapInstance,
        type: 'click',
      };
      
      clickHandler?.(mockEvent);
      
      await waitFor(() => {
        expect(onZoneClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining(mockEvent)
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveAttribute('role', 'application');
      expect(mapContainer).toHaveAttribute('aria-label', 'Interactive map for zone selection');
    });

    it('should support keyboard navigation', async () => {
      const ref = React.createRef<MapboxZoneSelectorRef>();
      const onSelectionChange = jest.fn();
      
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const mapContainer = screen.getByRole('application');
      
      // Focus the map
      fireEvent.focus(mapContainer);
      
      // Test arrow key navigation
      fireEvent.keyDown(mapContainer, { key: 'ArrowUp' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowDown' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowLeft' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowRight' });
      
      // Test selection with Enter/Space
      fireEvent.keyDown(mapContainer, { key: 'Enter' });
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalled();
      });
    });

    it('should announce zone selection to screen readers', async () => {
      render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      // Check for live region
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle window resize', async () => {
      render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Trigger resize
      globalThis.dispatchEvent(new Event('resize'));
      
      await waitFor(() => {
        expect(mapInstance.resize).toHaveBeenCalled();
      });
    });

    it('should work on mobile devices', () => {
      // Mock touch support
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
      
      render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      // Should render without errors on mobile
      expect(screen.getByRole('application')).toBeInTheDocument();
      
      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme by default', () => {
      const { container } = render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveClass('mapbox-zone-selector--light');
    });

    it('should apply dark theme when specified', () => {
      const { container } = render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          theme="dark"
        />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveClass('mapbox-zone-selector--dark');
    });

    it('should apply custom theme object', () => {
      const customTheme = {
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#ffffff',
          surface: '#f0f0f0',
          text: '#000000',
          border: '#cccccc',
          hover: '#ff6666',
          selected: '#0066ff',
          error: '#ff0000',
          warning: '#ffaa00',
          success: '#00ff00',
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
        },
        borderRadius: {
          sm: '2px',
          md: '4px',
          lg: '8px',
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.1)',
          md: '0 2px 4px rgba(0,0,0,0.1)',
          lg: '0 4px 8px rgba(0,0,0,0.1)',
        },
        transitions: {
          fast: '150ms ease',
          normal: '300ms ease',
          slow: '500ms ease',
        },
      };
      
      const { container } = render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          theme={customTheme}
        />
      );
      
      const mapContainer = container.firstChild as HTMLElement;
      expect(mapContainer).toHaveStyle({
        '--mzs-primary': '#ff0000',
        '--mzs-hover': '#ff6666',
        '--mzs-selected': '#0066ff',
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <>{children}</>;
      };
      
      const { rerender } = render(
        <TestWrapper>
          <MapboxZoneSelector mapboxToken={mockMapboxToken} />
        </TestWrapper>
      );
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      // Re-render with same props
      rerender(
        <TestWrapper>
          <MapboxZoneSelector mapboxToken={mockMapboxToken} />
        </TestWrapper>
      );
      
      // Should not trigger additional renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });

  describe('Cleanup', () => {
    it('should clean up map instance on unmount', () => {
      const { unmount } = render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      unmount();
      
      expect(mapInstance.remove).toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(
        <MapboxZoneSelector mapboxToken={mockMapboxToken} />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      unmount();
      
      // Verify event listeners were removed
      expect(mapInstance.off).toHaveBeenCalled();
    });
  });
});