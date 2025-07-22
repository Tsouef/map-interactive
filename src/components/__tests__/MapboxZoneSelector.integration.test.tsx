import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MapboxZoneSelector } from '../MapboxZoneSelector';
import mapboxgl from 'mapbox-gl';
import type { Zone } from '../../types';

describe('MapboxZoneSelector Zone Selection Integration', () => {
  const mockMapboxToken = 'test-token-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Zone Layer Interaction', () => {
    it('should create zones layer on map load', async () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const loadCallback = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, () => void])[0] === 'load'
      )?.[1];
      
      loadCallback?.();
      
      await waitFor(() => {
        expect(mapInstance.addSource).toHaveBeenCalledWith('zones', expect.any(Object));
        expect(mapInstance.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'zones-fill',
            type: 'fill',
            source: 'zones'
          })
        );
        expect(mapInstance.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'zones-line',
            type: 'line',
            source: 'zones'
          })
        );
      });
    });

    it('should handle click on zones layer', async () => {
      const onZoneClick = jest.fn();
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          onZoneClick={onZoneClick}
        />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Mock queryRenderedFeatures to return a zone feature
      mapInstance.queryRenderedFeatures.mockReturnValue([
        {
          properties: {
            id: 'paris-1',
            name: 'Paris 1st',
            postalCode: '75001'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.3, 48.85], [2.35, 48.85], [2.35, 48.87], [2.3, 48.87], [2.3, 48.85]]]
          }
        }
      ]);
      
      // Find the zones-fill click handler
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'click' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      const mockEvent = {
        lngLat: { lng: 2.325, lat: 48.86 },
        point: { x: 100, y: 100 },
        originalEvent: new MouseEvent('click'),
        target: mapInstance,
        type: 'click'
      };
      
      clickHandler?.(mockEvent);
      
      await waitFor(() => {
        expect(onZoneClick).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'paris-1',
            name: 'Paris 1st',
            properties: expect.objectContaining({ postalCode: '75001' })
          }),
          expect.any(Object)
        );
      });
    });

    it('should update layer paint properties when zone is selected', async () => {
      const onSelectionChange = jest.fn();
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Mock zone feature
      mapInstance.queryRenderedFeatures.mockReturnValue([
        {
          properties: { id: 'zone-1', name: 'Zone 1' },
          geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }
        }
      ]);
      
      // Trigger zone selection
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'click' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      clickHandler?.({ point: { x: 100, y: 100 } });
      
      await waitFor(() => {
        expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
          'zones-fill',
          'fill-color',
          expect.any(Object) // Expression for conditional coloring
        );
        expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
          'zones-fill',
          'fill-opacity',
          expect.any(Object) // Expression for conditional opacity
        );
      });
    });

    it('should handle hover state on zones', async () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Find mouseenter handler
      const mouseEnterHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'mouseenter' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      // Find mouseleave handler
      const mouseLeaveHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'mouseleave' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      // Mock zone feature for hover
      mapInstance.queryRenderedFeatures.mockReturnValue([
        {
          properties: { id: 'zone-hover', name: 'Hover Zone' },
          geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }
        }
      ]);
      
      // Trigger mouse enter
      mouseEnterHandler?.({ point: { x: 100, y: 100 } });
      
      await waitFor(() => {
        expect(mapInstance.getCanvas().style.cursor).toBe('pointer');
        expect(mapInstance.setFeatureState).toHaveBeenCalledWith(
          { source: 'zones', id: 'zone-hover' },
          { hover: true }
        );
      });
      
      // Trigger mouse leave
      mouseLeaveHandler?.({});
      
      await waitFor(() => {
        expect(mapInstance.getCanvas().style.cursor).toBe('');
        expect(mapInstance.removeFeatureState).toHaveBeenCalledWith(
          { source: 'zones', id: 'zone-hover' }
        );
      });
    });
  });

  describe('Selection State Management', () => {
    it('should toggle zone selection on click', async () => {
      const onSelectionChange = jest.fn();
      render(
        <MapboxZoneSelector 
          mapboxToken={mockMapboxToken}
          multiSelect={true}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'click' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      const mockZone = {
        properties: { id: 'toggle-zone', name: 'Toggle Zone' },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }
      };
      
      mapInstance.queryRenderedFeatures.mockReturnValue([mockZone]);
      
      // First click - select
      clickHandler?.({ point: { x: 100, y: 100 } });
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenLastCalledWith(
          [expect.objectContaining({ id: 'toggle-zone' })],
          expect.any(Array)
        );
      });
      
      // Second click - deselect
      clickHandler?.({ point: { x: 100, y: 100 } });
      
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenLastCalledWith([], []);
      });
    });

    it('should handle max selections limit', async () => {
      const onSelectionChange = jest.fn();
      const ref = React.createRef<any>();
      
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
          multiSelect={true}
          maxSelections={2}
          onSelectionChange={onSelectionChange}
        />
      );
      
      // Select 3 zones using ref methods
      act(() => {
        ref.current?.selectZone('zone-1');
        ref.current?.selectZone('zone-2');
        ref.current?.selectZone('zone-3');
      });
      
      await waitFor(() => {
        const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
        expect(lastCall[0]).toHaveLength(2); // Only 2 zones should be selected
      });
    });
  });

  describe('Visual States', () => {
    it('should apply correct styles for normal state', async () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      const loadCallback = mapInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, () => void])[0] === 'load'
      )?.[1];
      
      loadCallback?.();
      
      await waitFor(() => {
        // Check fill layer styles
        const fillLayer = mapInstance.addLayer.mock.calls.find(
          (call: any[]) => call[0].id === 'zones-fill'
        )?.[0];
        
        expect(fillLayer.paint).toMatchObject({
          'fill-color': expect.any(Object),
          'fill-opacity': expect.any(Object)
        });
        
        // Check line layer styles
        const lineLayer = mapInstance.addLayer.mock.calls.find(
          (call: any[]) => call[0].id === 'zones-line'
        )?.[0];
        
        expect(lineLayer.paint).toMatchObject({
          'line-color': expect.any(Object),
          'line-width': expect.any(Object)
        });
      });
    });
  });

  describe('Performance', () => {
    it('should not query features when clicking outside zones', async () => {
      render(<MapboxZoneSelector mapboxToken={mockMapboxToken} />);
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Mock empty features
      mapInstance.queryRenderedFeatures.mockReturnValue([]);
      
      const clickHandler = mapInstance.on.mock.calls.find(
        (call: unknown[]) => 
          (call as [string, string, (e: unknown) => void])[0] === 'click' &&
          (call as [string, string, (e: unknown) => void])[1] === 'zones-fill'
      )?.[2];
      
      clickHandler?.({ point: { x: 100, y: 100 } });
      
      // Should not attempt to process empty zones
      expect(mapInstance.setFeatureState).not.toHaveBeenCalled();
    });

    it('should batch state updates for multiple selections', async () => {
      const ref = React.createRef<any>();
      render(
        <MapboxZoneSelector 
          ref={ref}
          mapboxToken={mockMapboxToken}
          multiSelect={true}
        />
      );
      
      const mapInstance = (mapboxgl.Map as jest.Mock).mock.results[0].value;
      
      // Select multiple zones rapidly
      act(() => {
        ref.current?.selectZone('zone-1');
        ref.current?.selectZone('zone-2');
        ref.current?.selectZone('zone-3');
      });
      
      // Should batch updates efficiently
      await waitFor(() => {
        // Verify that map updates are called, but not excessively
        const paintPropertyCalls = mapInstance.setPaintProperty.mock.calls.length;
        expect(paintPropertyCalls).toBeLessThan(10); // Should be batched
      });
    });
  });
});