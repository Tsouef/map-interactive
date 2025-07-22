import { useState, useEffect, useRef } from 'react';
import type { LatLngBounds } from 'leaflet';

interface VirtualizationOptions<T> {
  items: T[];
  enabled: boolean;
  getBounds: () => LatLngBounds;
  getItemBounds: (item: T) => [number, number, number, number] | undefined;
  buffer?: number; // Percentage of viewport to buffer
}

export function useVirtualization<T>({
  items,
  enabled,
  getBounds,
  getItemBounds,
  buffer = 0.2
}: VirtualizationOptions<T>): T[] | null {
  const [visibleItems, setVisibleItems] = useState<T[] | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setVisibleItems(null);
      return undefined;
    }

    const updateVisibleItems = () => {
      const bounds = getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();
      
      // Add buffer
      const latBuffer = (north - south) * buffer;
      const lngBuffer = (east - west) * buffer;
      
      const bufferedBounds = {
        north: north + latBuffer,
        south: south - latBuffer,
        east: east + lngBuffer,
        west: west - lngBuffer
      };
      
      const visible = items.filter(item => {
        const bbox = getItemBounds(item);
        if (!bbox) return true; // Include items without bounds
        
        const [minLng, minLat, maxLng, maxLat] = bbox;
        
        // Check if bbox intersects with buffered viewport
        return !(
          maxLat < bufferedBounds.south ||
          minLat > bufferedBounds.north ||
          maxLng < bufferedBounds.west ||
          minLng > bufferedBounds.east
        );
      });
      
      setVisibleItems(visible);
    };

    // Debounce updates
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    frameRef.current = requestAnimationFrame(updateVisibleItems);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [items, enabled, getBounds, getItemBounds, buffer]);

  return visibleItems;
}