import { render, screen, waitFor, act } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { EnhancedTileLayer, EnhancedTileLayerProps } from '../EnhancedTileLayer';
import { TILE_PROVIDERS } from '../../../config/tileProviders';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  TileLayer: jest.fn(({ url, attribution, maxZoom, subdomains, crossOrigin, errorTileUrl }) => (
    <div 
      data-testid="tile-layer"
      data-url={url}
      data-attribution={attribution}
      data-max-zoom={maxZoom}
      data-subdomains={subdomains?.join(',')}
      data-cross-origin={crossOrigin}
      data-error-tile-url={errorTileUrl}
    />
  )),
  useMap: jest.fn()
}));

describe('EnhancedTileLayer', () => {
  let mockMap: {
    on: jest.Mock;
    off: jest.Mock;
  };
  const mockUseMap = jest.requireMock('react-leaflet').useMap as jest.Mock;

  beforeEach(() => {
    mockMap = {
      on: jest.fn(),
      off: jest.fn()
    };
    mockUseMap.mockReturnValue(mockMap);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithMap = (props: Partial<EnhancedTileLayerProps> = {}) => {
    return render(
      <MapContainer center={[0, 0]} zoom={10}>
        <EnhancedTileLayer {...props} />
      </MapContainer>
    );
  };

  describe('rendering', () => {
    it('should render with default provider', () => {
      renderWithMap();
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toBeInTheDocument();
      expect(tileLayer).toHaveAttribute('data-url', TILE_PROVIDERS.openstreetmap.url);
      expect(tileLayer).toHaveAttribute('data-attribution', TILE_PROVIDERS.openstreetmap.attribution);
      expect(tileLayer).toHaveAttribute('data-max-zoom', String(TILE_PROVIDERS.openstreetmap.maxZoom));
    });

    it('should render with specified provider', () => {
      renderWithMap({ provider: 'cartoDB' });
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-url', expect.stringContaining('basemaps.cartocdn.com/light_all'));
    });

    it('should render with custom provider object', () => {
      const customProvider = {
        name: 'Custom Provider',
        url: 'https://custom.tiles.com/{z}/{x}/{y}.png',
        attribution: 'Custom Attribution',
        maxZoom: 22
      };
      
      renderWithMap({ provider: customProvider });
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-url', customProvider.url);
      expect(tileLayer).toHaveAttribute('data-attribution', customProvider.attribution);
      expect(tileLayer).toHaveAttribute('data-max-zoom', String(customProvider.maxZoom));
    });

    it('should handle retina displays when detectRetina is enabled', () => {
      renderWithMap({ provider: 'cartoDB', detectRetina: true });
      
      const tileLayer = screen.getByTestId('tile-layer');
      const url = tileLayer.getAttribute('data-url');
      expect(url).toContain('@2x');
    });

    it('should not use retina tiles when detectRetina is disabled', () => {
      renderWithMap({ provider: 'cartoDB', detectRetina: false });
      
      const tileLayer = screen.getByTestId('tile-layer');
      const url = tileLayer.getAttribute('data-url');
      expect(url).not.toContain('{r}');
      expect(url).not.toContain('@2x');
    });

    it('should set crossOrigin when specified', () => {
      renderWithMap({ crossOrigin: true });
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-cross-origin', 'true');
    });

    it('should include error tile URL', () => {
      renderWithMap();
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toHaveAttribute('data-error-tile-url', '/images/tile-error.svg');
    });
  });

  describe('event handling', () => {
    it('should register event listeners on mount', () => {
      renderWithMap();
      
      expect(mockMap.on).toHaveBeenCalledWith('tileloadstart', expect.any(Function));
      expect(mockMap.on).toHaveBeenCalledWith('tileload', expect.any(Function));
      expect(mockMap.on).toHaveBeenCalledWith('tileerror', expect.any(Function));
    });

    it('should unregister event listeners on unmount', () => {
      const { unmount } = renderWithMap();
      
      unmount();
      
      expect(mockMap.off).toHaveBeenCalledWith('tileloadstart', expect.any(Function));
      expect(mockMap.off).toHaveBeenCalledWith('tileload', expect.any(Function));
      expect(mockMap.off).toHaveBeenCalledWith('tileerror', expect.any(Function));
    });

    it('should call onTileLoadStart when tiles start loading', () => {
      const onTileLoadStart = jest.fn();
      renderWithMap({ onTileLoadStart });
      
      const handleTileLoadStart = mockMap.on.mock.calls.find(
        call => call[0] === 'tileloadstart'
      )[1];
      
      act(() => {
        handleTileLoadStart();
      });
      
      expect(onTileLoadStart).toHaveBeenCalled();
    });

    it('should call onTileLoad when tiles finish loading', () => {
      const onTileLoad = jest.fn();
      renderWithMap({ onTileLoad });
      
      const handleTileLoad = mockMap.on.mock.calls.find(
        call => call[0] === 'tileload'
      )[1];
      
      act(() => {
        handleTileLoad();
      });
      
      expect(onTileLoad).toHaveBeenCalled();
    });

    it('should call onTileError and switch to fallback provider on error', async () => {
      const onTileError = jest.fn();
      const customProvider = {
        name: 'Custom Provider',
        url: 'https://custom.tiles.com/{z}/{x}/{y}.png',
        attribution: 'Custom',
        maxZoom: 18
      };
      
      renderWithMap({ 
        provider: customProvider,
        fallbackProvider: 'openstreetmap',
        onTileError 
      });
      
      const handleTileError = mockMap.on.mock.calls.find(
        call => call[0] === 'tileerror'
      )[1];
      
      const mockTileErrorEvent = {
        tile: { src: 'https://failed-tile.com/1/2/3.png' }
      };
      
      act(() => {
        handleTileError(mockTileErrorEvent);
      });
      
      await waitFor(() => {
        expect(onTileError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Tile load failed')
          })
        );
      });
      
      // Check that provider switched to fallback
      await waitFor(() => {
        const tileLayer = screen.getByTestId('tile-layer');
        expect(tileLayer).toHaveAttribute('data-url', TILE_PROVIDERS.openstreetmap.url);
      });
    });
  });

  describe('loading indicator', () => {
    it('should show loading indicator when tiles are loading', () => {
      renderWithMap();
      
      const handleTileLoadStart = mockMap.on.mock.calls.find(
        call => call[0] === 'tileloadstart'
      )[1];
      
      // Simulate multiple tiles loading
      act(() => {
        handleTileLoadStart();
        handleTileLoadStart();
        handleTileLoadStart();
      });
      
      const loadingIndicator = screen.getByText(/Loading map tiles\.\.\. \(3\)/);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator when all tiles are loaded', () => {
      renderWithMap();
      
      const handleTileLoadStart = mockMap.on.mock.calls.find(
        call => call[0] === 'tileloadstart'
      )[1];
      const handleTileLoad = mockMap.on.mock.calls.find(
        call => call[0] === 'tileload'
      )[1];
      
      act(() => {
        // Start loading 3 tiles
        handleTileLoadStart();
        handleTileLoadStart();
        handleTileLoadStart();
        
        // Finish loading all 3
        handleTileLoad();
        handleTileLoad();
        handleTileLoad();
      });
      
      const loadingIndicator = screen.queryByText(/Loading map tiles/);
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it('should handle tile errors in loading count', () => {
      renderWithMap();
      
      const handleTileLoadStart = mockMap.on.mock.calls.find(
        call => call[0] === 'tileloadstart'
      )[1];
      const handleTileError = mockMap.on.mock.calls.find(
        call => call[0] === 'tileerror'
      )[1];
      
      act(() => {
        // Start loading 3 tiles
        handleTileLoadStart();
        handleTileLoadStart();
        handleTileLoadStart();
        
        // One fails
        handleTileError({ tile: { src: 'failed.png' } });
      });
      
      const loadingIndicator = screen.getByText(/Loading map tiles\.\.\. \(2\)/);
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('provider switching', () => {
    it('should only switch to fallback once on first error', async () => {
      const customProvider = {
        name: 'Custom Provider',
        url: 'https://custom.tiles.com/{z}/{x}/{y}.png',
        attribution: 'Custom',
        maxZoom: 18
      };
      
      renderWithMap({
        provider: customProvider,
        fallbackProvider: 'openstreetmap'
      });
      
      const handleTileError = mockMap.on.mock.calls.find(
        call => call[0] === 'tileerror'
      )[1];
      
      act(() => {
        // First error - should switch
        handleTileError({ tile: { src: 'failed1.png' } });
      });
      
      await waitFor(() => {
        const tileLayer = screen.getByTestId('tile-layer');
        expect(tileLayer).toHaveAttribute('data-url', TILE_PROVIDERS.openstreetmap.url);
      });
      
      act(() => {
        // Second error - should not switch again
        handleTileError({ tile: { src: 'failed2.png' } });
      });
      
      await waitFor(() => {
        const tileLayer = screen.getByTestId('tile-layer');
        expect(tileLayer).toHaveAttribute('data-url', TILE_PROVIDERS.openstreetmap.url);
      });
    });
  });
});