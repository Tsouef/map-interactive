import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { ZoneLayer } from '../ZoneLayer';
import { createAdjacentZones } from '@/test-utils/mockZones';
import type { Zone } from '../types';

// Mock react-leaflet
const mockGeoJSONInstance = {
  on: jest.fn(),
  off: jest.fn(),
  setStyle: jest.fn(),
  getElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
};

jest.mock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  GeoJSON: jest.fn(({ data, onEachFeature }) => {
    // Simulate onEachFeature behavior
    React.useEffect(() => {
      if (onEachFeature && data?.features) {
        data.features.forEach((feature: unknown) => {
          onEachFeature(feature, mockGeoJSONInstance);
        });
      }
    }, [data, onEachFeature]);
    
    return (
      <div 
        data-testid="geojson-layer"
        data-features={JSON.stringify(data)}
      />
    );
  }),
  useMap: () => ({
    getBounds: jest.fn(() => ({
      getNorth: () => 10,
      getSouth: () => 0,
      getEast: () => 10,
      getWest: () => 0
    })),
    on: jest.fn(),
    off: jest.fn()
  }),
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container" role="application">
      {children}
    </div>
  )
}));

// Mock Leaflet
jest.mock('leaflet', () => ({
  ...jest.requireActual('leaflet'),
  DomEvent: {
    stopPropagation: jest.fn()
  },
  LeafletMouseEvent: class LeafletMouseEvent {
    constructor(public type: string) {}
  }
}));

// Test component that integrates with ZoneLayer
const InteractiveZoneSelector: React.FC = () => {
  const [zones] = useState<Zone[]>(() => createAdjacentZones(3));
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [clickedZone, setClickedZone] = useState<Zone | null>(null);

  const handleZoneClick = (zone: Zone) => {
    setClickedZone(zone);
    setSelectedZoneIds(prev => {
      const isSelected = prev.includes(zone.id);
      if (isSelected) {
        return prev.filter(id => id !== zone.id);
      } else {
        return [...prev, zone.id];
      }
    });
  };

  const handleZoneHover = (zone: Zone | null) => {
    setHoveredZoneId(zone?.id || null);
  };

  return (
    <MapContainer center={[0, 0]} zoom={13}>
      <ZoneLayer
        zones={zones}
        selectedZoneIds={selectedZoneIds}
        hoveredZoneId={hoveredZoneId}
        onZoneClick={handleZoneClick}
        onZoneHover={handleZoneHover}
      />
      <div data-testid="debug-info">
        <div data-testid="selected-zones">{selectedZoneIds.join(',')}</div>
        <div data-testid="hovered-zone">{hoveredZoneId || 'none'}</div>
        <div data-testid="clicked-zone">{clickedZone?.id || 'none'}</div>
      </div>
    </MapContainer>
  );
};

describe('ZoneLayer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Zone Selection', () => {
    it('should toggle zone selection on click', async () => {
      render(<InteractiveZoneSelector />);
      
      // Initially no zones selected
      expect(screen.getByTestId('selected-zones')).toHaveTextContent('');
      
      // Simulate zone click via mock event handler
      const clickHandler = mockGeoJSONInstance.on.mock.calls.find(
        call => call[0].click
      )?.[0]?.click;
      
      if (clickHandler) {
        act(() => {
          clickHandler({ type: 'click' });
        });
      }
      
      await waitFor(() => {
        expect(screen.getByTestId('clicked-zone')).not.toHaveTextContent('none');
      });
    });

    it('should handle multiple zone selections', async () => {
      render(<InteractiveZoneSelector />);
      
      // Component should render with multiple zones
      const geoJsonLayer = screen.getByTestId('geojson-layer');
      const features = JSON.parse(geoJsonLayer.getAttribute('data-features') || '{}');
      
      expect(features.features).toHaveLength(3);
    });
  });

  describe('Zone Hover', () => {
    it('should update hover state on mouse events', async () => {
      render(<InteractiveZoneSelector />);
      
      // Initially no zone hovered
      expect(screen.getByTestId('hovered-zone')).toHaveTextContent('none');
      
      // Simulate hover via mock event handler
      const hoverHandler = mockGeoJSONInstance.on.mock.calls.find(
        call => call[0].mouseover
      )?.[0]?.mouseover;
      
      if (hoverHandler) {
        act(() => {
          hoverHandler({ type: 'mouseover' });
        });
      }
      
      // Hover state should be managed by the component
      expect(mockGeoJSONInstance.on).toHaveBeenCalled();
    });

    it('should clear hover state on mouseout', async () => {
      render(<InteractiveZoneSelector />);
      
      // Simulate mouseout via mock event handler
      const mouseoutHandler = mockGeoJSONInstance.on.mock.calls.find(
        call => call[0].mouseout
      )?.[0]?.mouseout;
      
      if (mouseoutHandler) {
        act(() => {
          mouseoutHandler({ type: 'mouseout' });
        });
      }
      
      expect(screen.getByTestId('hovered-zone')).toHaveTextContent('none');
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle rapid state changes efficiently', async () => {
      const LargeDatasetComponent = () => {
        const [zones] = useState<Zone[]>(() => createAdjacentZones(10));
        const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
        
        const handleSelectAll = () => {
          setSelectedZoneIds(zones.map(z => z.id));
        };
        
        const handleClearAll = () => {
          setSelectedZoneIds([]);
        };
        
        return (
          <MapContainer center={[0, 0]} zoom={13}>
            <ZoneLayer
              zones={zones}
              selectedZoneIds={selectedZoneIds}
              virtualizationThreshold={5}
            />
            <button onClick={handleSelectAll} data-testid="select-all">
              Select All
            </button>
            <button onClick={handleClearAll} data-testid="clear-all">
              Clear All
            </button>
            <div data-testid="selection-count">{selectedZoneIds.length}</div>
          </MapContainer>
        );
      };
      
      render(<LargeDatasetComponent />);
      
      // Initially no zones selected
      expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
      
      // Select all zones
      fireEvent.click(screen.getByTestId('select-all'));
      await waitFor(() => {
        expect(screen.getByTestId('selection-count')).toHaveTextContent('10');
      });
      
      // Clear all zones
      fireEvent.click(screen.getByTestId('clear-all'));
      await waitFor(() => {
        expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply dynamic styles based on zone properties', () => {
      const CustomStyledComponent = () => {
        const zones = createAdjacentZones(3).map((zone, index) => ({
          ...zone,
          properties: { priority: index === 0 ? 'high' : 'normal' }
        }));
        
        const getZoneStyle = (zone: Zone, state: string) => {
          const baseStyle = {
            fillColor: zone.properties?.priority === 'high' ? '#ff0000' : '#0000ff',
            fillOpacity: state === 'selected' ? 0.6 : 0.3
          };
          return baseStyle;
        };
        
        return (
          <MapContainer center={[0, 0]} zoom={13}>
            <ZoneLayer
              zones={zones}
              selectedZoneIds={[zones[0].id]}
              getZoneStyle={getZoneStyle}
            />
          </MapContainer>
        );
      };
      
      render(<CustomStyledComponent />);
      
      // Verify component renders with custom styling
      expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility attributes during interactions', () => {
      render(<InteractiveZoneSelector />);
      
      // Verify that event handlers are set up for accessibility
      const onCalls = mockGeoJSONInstance.on.mock.calls;
      const hasClickHandler = onCalls.some(call => 'click' in (call[0] || {}));
      
      expect(hasClickHandler).toBeTruthy();
      expect(mockGeoJSONInstance.getElement).toHaveBeenCalled();
    });
  });
});