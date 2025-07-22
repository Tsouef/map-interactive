import React from 'react';
import { render } from '@testing-library/react';
import { ZoneLayer } from '../ZoneLayer';
import type { Zone } from '../../types';

// Mock mapbox-gl
jest.mock('mapbox-gl');

interface MockMapboxMap {
  addSource: jest.Mock;
  addLayer: jest.Mock;
  removeLayer: jest.Mock;
  removeSource: jest.Mock;
  getSource: jest.Mock;
  getLayer: jest.Mock;
  setFeatureState: jest.Mock;
  removeFeatureState: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
  isStyleLoaded: jest.Mock;
  loaded: jest.Mock;
  queryRenderedFeatures: jest.Mock;
  getCanvas: jest.Mock;
  getBounds: jest.Mock;
}

interface MockMapboxSource {
  setData: jest.Mock;
}

describe('ZoneLayer', () => {
  let mockMap: MockMapboxMap;
  let mockSource: MockMapboxSource;
  
  const mockZones: Zone[] = [
    {
      id: 'zone-1',
      name: 'Zone 1',
      coordinates: [[
        [2.3522, 48.8566],
        [2.3622, 48.8566],
        [2.3622, 48.8666],
        [2.3522, 48.8666],
        [2.3522, 48.8566]
      ]],
      properties: { postalCode: '75001' }
    },
    {
      id: 'zone-2',
      name: 'Zone 2',
      coordinates: [[
        [2.3622, 48.8566],
        [2.3722, 48.8566],
        [2.3722, 48.8666],
        [2.3622, 48.8666],
        [2.3622, 48.8566]
      ]],
      properties: { postalCode: '75002' }
    }
  ];

  beforeEach(() => {
    mockSource = {
      setData: jest.fn()
    };
    
    mockMap = {
      addSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn().mockReturnValue(null), // Initially no source
      getLayer: jest.fn().mockReturnValue(null), // Initially no layers
      setFeatureState: jest.fn(),
      removeFeatureState: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      isStyleLoaded: jest.fn().mockReturnValue(true),
      loaded: jest.fn().mockReturnValue(true),
      queryRenderedFeatures: jest.fn().mockReturnValue([]),
      getCanvas: jest.fn().mockReturnValue({ style: {} }),
      getBounds: jest.fn().mockReturnValue({
        getNorthEast: () => ({ lat: 48.9, lng: 2.4 }),
        getSouthWest: () => ({ lat: 48.8, lng: 2.3 })
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );
      
      expect(container).toBeDefined();
    });

    it('should add source and layers to the map', () => {
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      // Wait for useEffect to run
      expect(mockMap.isStyleLoaded).toHaveBeenCalled();
      expect(mockMap.getSource).toHaveBeenCalledWith('zones');
      expect(mockMap.addSource).toHaveBeenCalledWith('zones', {
        type: 'geojson',
        data: expect.any(Object)
      });
      
      expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones'
      }));
      
      expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
        id: 'zones-border',
        type: 'line',
        source: 'zones'
      }));
    });

    it('should clean up on unmount', () => {
      // Mock that layers exist when checking
      mockMap.getLayer.mockImplementation((id) => {
        if (id === 'zones-fill' || id === 'zones-border') {
          return { id }; // Return layer object
        }
        return null;
      });
      mockMap.getSource.mockImplementation((id) => {
        if (id === 'zones') {
          return mockSource; // Return source object
        }
        return null;
      });
      
      const { unmount } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      unmount();

      expect(mockMap.removeLayer).toHaveBeenCalledWith('zones-fill');
      expect(mockMap.removeLayer).toHaveBeenCalledWith('zones-border');
      expect(mockMap.removeSource).toHaveBeenCalledWith('zones');
    });
  });

  describe('Zone Data Management', () => {
    it('should convert zones to GeoJSON format', () => {
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      const sourceData = mockMap.addSource.mock.calls[0][1].data;
      expect(sourceData.type).toBe('FeatureCollection');
      expect(sourceData.features).toHaveLength(2);
      expect(sourceData.features[0].properties.id).toBe('zone-1');
      expect(sourceData.features[1].properties.id).toBe('zone-2');
      // Check geometry type is Polygon for simple zones
      expect(sourceData.features[0].geometry.type).toBe('Polygon');
    });

    it('should update data when zones change', () => {
      // After initial render, getSource should return the mockSource
      mockMap.getSource.mockReturnValue(mockSource);
      
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      const newZones: Zone[] = [...mockZones, {
        id: 'zone-3',
        name: 'Zone 3',
        coordinates: [[
          [2.3722, 48.8566],
          [2.3822, 48.8566],
          [2.3822, 48.8666],
          [2.3722, 48.8666],
          [2.3722, 48.8566]
        ]],
        properties: { postalCode: '75003' }
      }];

      rerender(
        <ZoneLayer
          map={mockMap as any}
          zones={newZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      expect(mockSource.setData).toHaveBeenCalledWith(expect.objectContaining({
        type: 'FeatureCollection',
        features: expect.arrayContaining([
          expect.objectContaining({ properties: expect.objectContaining({ id: 'zone-3' }) })
        ])
      }));
    });
  });

  describe('Interaction States', () => {
    it('should apply hover state to zones', () => {
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      rerender(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId="zone-1"
        />
      );

      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'zones', id: 'zone-1' },
        { hover: true }
      );
    });

    it('should remove hover state when hoveredZoneId changes', () => {
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId="zone-1"
        />
      );

      rerender(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId="zone-2"
        />
      );

      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'zones', id: 'zone-1' },
        'hover'
      );
      
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'zones', id: 'zone-2' },
        { hover: true }
      );
    });

    it('should apply selected state to zones', () => {
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={['zone-1', 'zone-2']}
          hoveredZoneId={null}
        />
      );

      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'zones', id: 'zone-1' },
        { selected: true }
      );
      
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'zones', id: 'zone-2' },
        { selected: true }
      );
    });
  });

  describe('Event Handling', () => {
    it('should handle zone click events', () => {
      const onZoneClick = jest.fn();
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneClick={onZoneClick}
        />
      );

      // Simulate map click event handler being set up
      const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click' && call[1] === 'zones-fill')?.[2];
      expect(clickHandler).toBeDefined();

      // Create mock event
      const mockEvent = {
        features: [{
          properties: { id: 'zone-1' }
        }],
        lngLat: { lng: 2.3522, lat: 48.8566 },
        point: { x: 100, y: 100 },
        originalEvent: new MouseEvent('click')
      };

      // Call the click handler
      clickHandler(mockEvent);

      expect(onZoneClick).toHaveBeenCalledWith('zone-1', mockEvent);
    });

    it('should handle zone hover events', () => {
      const onZoneHover = jest.fn();
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneHover={onZoneHover}
        />
      );

      // Simulate mouseenter event
      const mouseEnterHandler = mockMap.on.mock.calls.find(
        call => call[0] === 'mouseenter' && call[1] === 'zones-fill'
      )?.[2];

      const mockEvent = {
        features: [{
          properties: { id: 'zone-2' }
        }]
      };

      mouseEnterHandler(mockEvent);
      expect(onZoneHover).toHaveBeenCalledWith('zone-2');
    });

    it('should handle mouse leave events', () => {
      const onZoneHover = jest.fn();
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneHover={onZoneHover}
        />
      );

      // Simulate mouseleave event
      const mouseLeaveHandler = mockMap.on.mock.calls.find(
        call => call[0] === 'mouseleave' && call[1] === 'zones-fill'
      )?.[2];

      mouseLeaveHandler({});
      expect(onZoneHover).toHaveBeenCalledWith(null);
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      const customStyles = {
        fillColor: '#ff0000',
        fillOpacity: 0.5,
        strokeColor: '#00ff00',
        strokeWidth: 2,
        selectedFillColor: '#0000ff',
        selectedFillOpacity: 0.8,
        hoverFillOpacity: 0.6
      };

      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          styles={customStyles}
        />
      );

      const fillLayer = mockMap.addLayer.mock.calls.find(call => call[0].id === 'zones-fill')?.[0];
      // Check that custom colors are used in the data-driven expression
      expect(fillLayer.paint['fill-color']).toEqual(expect.arrayContaining([
        'case',
        expect.anything(),
        '#0000ff', // selectedFillColor
        '#ff0000'  // fillColor
      ]));
      expect(fillLayer.paint['fill-opacity']).toEqual(expect.arrayContaining([
        'case',
        expect.anything(),
        0.6,  // hoverFillOpacity
        expect.anything(),
        0.8,  // selectedFillOpacity
        0.5   // fillOpacity
      ]));
      
      const lineLayer = mockMap.addLayer.mock.calls.find(call => call[0].id === 'zones-border')?.[0];
      expect(lineLayer.paint['line-color']).toEqual(expect.arrayContaining([
        'case',
        expect.anything(),
        '#1e293b', // Default selectedStrokeColor
        '#00ff00'  // strokeColor
      ]));
      expect(lineLayer.paint['line-width']).toEqual(expect.arrayContaining([
        'case',
        expect.anything(),
        2, // Default hoverStrokeWidth
        expect.anything(),
        2, // Default selectedStrokeWidth
        2  // strokeWidth
      ]));
    });

    it('should use data-driven styling for states', () => {
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={['zone-1']}
          hoveredZoneId={null}
        />
      );

      const fillLayer = mockMap.addLayer.mock.calls.find(call => call[0].id === 'zones-fill')?.[0];
      
      // Check that fill-opacity uses feature state
      expect(fillLayer.paint['fill-opacity']).toEqual(expect.arrayContaining([
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        expect.any(Number),
        ['boolean', ['feature-state', 'selected'], false],
        expect.any(Number),
        expect.any(Number)
      ]));
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of zones efficiently', () => {
      const largeZoneSet: Zone[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `zone-${i}`,
        name: `Zone ${i}`,
        coordinates: [[
          [2.3522 + (i * 0.001), 48.8566],
          [2.3622 + (i * 0.001), 48.8566],
          [2.3622 + (i * 0.001), 48.8666],
          [2.3522 + (i * 0.001), 48.8666],
          [2.3522 + (i * 0.001), 48.8566]
        ]],
        properties: { postalCode: `750${i < 10 ? '0' + i : i}` }
      }));

      const { container } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={largeZoneSet}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          enableVirtualization={true}
        />
      );

      expect(container).toBeDefined();
      // Performance optimizations should be applied
      expect(mockMap.addSource).toHaveBeenCalled();
    });

    it('should simplify complex polygons when enabled', () => {
      const complexZone: Zone = {
        id: 'complex-zone',
        name: 'Complex Zone',
        coordinates: [[
          // Create a polygon with many points
          ...Array.from({ length: 1000 }, (_, i) => {
            const angle = (i / 1000) * 2 * Math.PI;
            return [
              2.3522 + 0.01 * Math.cos(angle),
              48.8566 + 0.01 * Math.sin(angle)
            ] as [number, number];
          }),
          [2.3522 + 0.01, 48.8566] // Close the polygon
        ]],
        properties: {}
      };

      render(
        <ZoneLayer
          map={mockMap as any}
          zones={[complexZone]}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          simplifyTolerance={0.001}
        />
      );

      const sourceData = mockMap.addSource.mock.calls[0][1].data;
      const simplifiedCoords = sourceData.features[0].geometry.coordinates[0];
      
      // Simplified polygon should have fewer points
      expect(simplifiedCoords.length).toBeLessThan(1000);
    });
  });

  describe('Touch Interactions', () => {
    it('should handle touch events on mobile devices', () => {
      const onZoneClick = jest.fn();
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={mockZones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneClick={onZoneClick}
        />
      );

      // Touch events should also trigger click handlers
      const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[2];
      
      const mockTouchEvent = {
        features: [{
          properties: { id: 'zone-1' }
        }],
        lngLat: { lng: 2.3522, lat: 48.8566 },
        point: { x: 100, y: 100 },
        originalEvent: new TouchEvent('touchend')
      };

      clickHandler(mockTouchEvent);
      expect(onZoneClick).toHaveBeenCalledWith('zone-1', mockTouchEvent);
    });
  });
});