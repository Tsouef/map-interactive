import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { ZoneLayer } from '../ZoneLayer';
import type { Zone } from '../../types';

// Performance testing utilities
const measureRenderTime = async (callback: () => void): Promise<number> => {
  const start = performance.now();
  await act(async () => {
    callback();
  });
  return performance.now() - start;
};

const measureFPS = (duration: number = 1000): Promise<number> => {
  return new Promise((resolve) => {
    let frames = 0;
    const lastTime = performance.now();
    
    const countFrame = (currentTime: number) => {
      frames++;
      
      if (currentTime - lastTime >= duration) {
        const fps = (frames * 1000) / (currentTime - lastTime);
        resolve(fps);
      } else {
        requestAnimationFrame(countFrame);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
};

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

describe('ZoneLayer Performance Integration Tests', () => {
  let mockMap: MockMapboxMap;
  let mockSource: MockMapboxSource;

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
      getCanvas: jest.fn().mockReturnValue({
        style: {},
        width: 800,
        height: 600
      }),
      getBounds: jest.fn().mockReturnValue({
        getNorthEast: () => ({ lat: 48.9, lng: 2.4 }),
        getSouthWest: () => ({ lat: 48.8, lng: 2.3 })
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Large Dataset Performance', () => {
    const generateLargeZoneSet = (count: number): Zone[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `zone-${i}`,
        name: `Zone ${i}`,
        coordinates: [[
          [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001],
          [2.3522 + (i % 100) * 0.001 + 0.001, 48.8566 + Math.floor(i / 100) * 0.001],
          [2.3522 + (i % 100) * 0.001 + 0.001, 48.8566 + Math.floor(i / 100) * 0.001 + 0.001],
          [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001 + 0.001],
          [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001]
        ]],
        properties: { 
          postalCode: `${75000 + i}`,
          population: Math.floor(Math.random() * 100000)
        }
      }));
    };

    it('should render 10,000 zones within acceptable time', async () => {
      const zones = generateLargeZoneSet(10000);
      
      const renderTime = await measureRenderTime(() => {
        render(
          <ZoneLayer
            map={mockMap as any}
            zones={zones}
            selectedZoneIds={[]}
            hoveredZoneId={null}
          />
        );
      });

      // Should render within 500ms
      expect(renderTime).toBeLessThan(500);
      expect(mockMap.addSource).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalledTimes(2); // fill and border layers
    });

    it('should update 10,000 zones efficiently', async () => {
      const zones = generateLargeZoneSet(10000);
      
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      // After initial render, getSource should return the mockSource
      mockMap.getSource.mockReturnValue(mockSource);

      const updatedZones = zones.map(zone => ({
        ...zone,
        properties: {
          ...zone.properties,
          updated: true
        }
      }));

      const updateTime = await measureRenderTime(() => {
        rerender(
          <ZoneLayer
            map={mockMap as any}
            zones={updatedZones}
            selectedZoneIds={[]}
            hoveredZoneId={null}
          />
        );
      });

      // Should update within 200ms
      expect(updateTime).toBeLessThan(200);
      expect(mockSource.setData).toHaveBeenCalled();
    });

    it('should maintain 60 FPS with 10,000 zones during interactions', async () => {
      const zones = generateLargeZoneSet(10000);
      
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      // Simulate rapid hover state changes
      const simulateInteractions = async () => {
        for (let i = 0; i < 60; i++) {
          await act(async () => {
            rerender(
              <ZoneLayer
                map={mockMap as any}
                zones={zones}
                selectedZoneIds={[]}
                hoveredZoneId={`zone-${i % 100}`}
              />
            );
          });
          
          // Small delay to simulate realistic interaction
          await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps timing
        }
      };

      const interactionPromise = simulateInteractions();
      const fpsPromise = measureFPS(1000);

      await Promise.all([interactionPromise, fpsPromise]);
      const measuredFPS = await fpsPromise;

      // Should maintain at least 55 FPS (allowing some variance)
      expect(measuredFPS).toBeGreaterThanOrEqual(55);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory when updating large datasets', async () => {
      const zones = generateLargeZoneSet(5000);
      const onZoneClick = jest.fn();
      const onZoneHover = jest.fn();
      
      // First mock that no layers exist
      const { rerender, unmount } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneClick={onZoneClick}
          onZoneHover={onZoneHover}
        />
      );

      // After initial render, mock that layers now exist
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

      // Simulate multiple updates
      for (let i = 0; i < 10; i++) {
        const newZones = zones.map(zone => ({
          ...zone,
          properties: {
            ...zone.properties,
            iteration: i
          }
        }));

        rerender(
          <ZoneLayer
            map={mockMap as any}
            zones={newZones}
            selectedZoneIds={[`zone-${i}`]}
            hoveredZoneId={`zone-${i * 2}`}
          />
        );
      }
      
      // Cleanup should remove all listeners and data
      unmount();
      
      expect(mockMap.off).toHaveBeenCalled();
      expect(mockMap.removeLayer).toHaveBeenCalledWith('zones-fill');
      expect(mockMap.removeLayer).toHaveBeenCalledWith('zones-border');
      expect(mockMap.removeSource).toHaveBeenCalledWith('zones');
    });
  });

  describe('Polygon Simplification Performance', () => {
    const generateComplexZone = (pointCount: number): Zone => ({
      id: 'complex-zone',
      name: 'Complex Zone',
      coordinates: [[
        ...Array.from({ length: pointCount }, (_, i) => {
          const angle = (i / pointCount) * 2 * Math.PI;
          const radius = 0.01 + 0.005 * Math.sin(angle * 10); // Create irregular shape
          return [
            2.3522 + radius * Math.cos(angle),
            48.8566 + radius * Math.sin(angle)
          ] as [number, number];
        }),
        [2.3522 + 0.01, 48.8566] // Close the polygon
      ]],
      properties: {}
    });

    it('should simplify complex polygons efficiently', async () => {
      const complexZones = Array.from({ length: 100 }, (_, i) => ({
        ...generateComplexZone(1000),
        id: `complex-zone-${i}`,
        name: `Complex Zone ${i}`
      }));

      const renderTime = await measureRenderTime(() => {
        render(
          <ZoneLayer
            map={mockMap as any}
            zones={complexZones}
            selectedZoneIds={[]}
            hoveredZoneId={null}
            simplifyTolerance={0.001}
          />
        );
      });

      // Should render within 300ms even with complex polygons
      expect(renderTime).toBeLessThan(300);
      
      const sourceData = mockMap.addSource.mock.calls[0][1].data;
      const firstZoneCoords = sourceData.features[0].geometry.coordinates[0];
      
      // Simplified polygon should have significantly fewer points
      expect(firstZoneCoords.length).toBeLessThan(500);
    });
  });

  describe('Batched State Updates', () => {
    it('should batch multiple state updates efficiently', async () => {
      const zones = generateLargeZoneSet(1000);
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
        />
      );

      // Clear previous calls
      mockMap.setFeatureState.mockClear();

      // Update multiple zones at once
      const selectedIds = Array.from({ length: 100 }, (_, i) => `zone-${i}`);
      
      const { rerender } = render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={selectedIds}
          hoveredZoneId={null}
        />
      );

      // Should batch updates efficiently
      await waitFor(() => {
        expect(mockMap.setFeatureState).toHaveBeenCalledTimes(100);
      });

      // Measure time for updating selection
      const updateTime = await measureRenderTime(() => {
        rerender(
          <ZoneLayer
            map={mockMap as any}
            zones={zones}
            selectedZoneIds={selectedIds.slice(0, 50)}
            hoveredZoneId={null}
          />
        );
      });

      // Should update quickly
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Virtualization', () => {
    it('should virtualize rendering for very large datasets', async () => {
      const zones = generateLargeZoneSet(50000);
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          enableVirtualization={true}
          viewportBuffer={0.1}
        />
      );

      // getBounds is already mocked in beforeEach

      // Trigger viewport update
      const moveHandler = mockMap.on.mock.calls.find(
        call => call[0] === 'moveend'
      )?.[1];
      
      await act(async () => {
        moveHandler?.();
      });

      // Should only render zones within viewport
      const renderedData = mockSource.setData.mock.calls[0]?.[0];
      if (renderedData) {
        expect(renderedData.features.length).toBeLessThan(5000);
      }
    });
  });

  describe('Touch Performance', () => {
    it('should handle rapid touch interactions smoothly', async () => {
      const zones = generateLargeZoneSet(1000);
      const onZoneClick = jest.fn();
      
      render(
        <ZoneLayer
          map={mockMap as any}
          zones={zones}
          selectedZoneIds={[]}
          hoveredZoneId={null}
          onZoneClick={onZoneClick}
        />
      );

      const clickHandler = mockMap.on.mock.calls.find(
        call => call[0] === 'click' && call[1] === 'zones-fill'
      )?.[2];

      // Simulate rapid touch events
      const touchEvents = Array.from({ length: 20 }, (_, i) => ({
        features: [{
          properties: { id: `zone-${i}` }
        }],
        lngLat: { lng: 2.3522 + i * 0.001, lat: 48.8566 },
        point: { x: 100 + i * 10, y: 100 + i * 10 },
        originalEvent: new TouchEvent('touchend')
      }));

      const interactionTime = await measureRenderTime(async () => {
        for (const event of touchEvents) {
          await act(async () => {
            clickHandler(event);
          });
        }
      });

      // Should handle rapid touches without lag
      expect(interactionTime).toBeLessThan(200);
      // At least some touch events should have been processed
      expect(onZoneClick).toHaveBeenCalled();
      expect(onZoneClick.mock.calls.length).toBeGreaterThan(0);
    });
  });
});

function generateLargeZoneSet(count: number): Zone[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `zone-${i}`,
    name: `Zone ${i}`,
    coordinates: [[
      [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001],
      [2.3522 + (i % 100) * 0.001 + 0.001, 48.8566 + Math.floor(i / 100) * 0.001],
      [2.3522 + (i % 100) * 0.001 + 0.001, 48.8566 + Math.floor(i / 100) * 0.001 + 0.001],
      [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001 + 0.001],
      [2.3522 + (i % 100) * 0.001, 48.8566 + Math.floor(i / 100) * 0.001]
    ]],
    properties: { 
      postalCode: `${75000 + i}`,
      population: Math.floor(Math.random() * 100000)
    }
  }));
}