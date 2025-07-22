import type { Zone } from '@/types';
import type { LeafletMouseEvent } from 'leaflet';

interface ZoneLayerProps {
  zones: Zone[];
  selectedZoneIds: string[];
  hoveredZoneId?: string;
  onZoneClick: (zone: Zone, event: LeafletMouseEvent) => void;
  onZoneHover: (zone: Zone | null) => void;
  theme: string | object;
}

// Mock implementation for testing
export const ZoneLayer = ({ zones, onZoneClick, onZoneHover }: ZoneLayerProps) => {
  return (
    <>
      {zones.map((zone) => (
        <div
          key={zone.id}
          data-testid={`zone-${zone.id}`}
          onClick={(e) => onZoneClick(zone, e as unknown as LeafletMouseEvent)}
          onMouseEnter={() => onZoneHover(zone)}
          onMouseLeave={() => onZoneHover(null)}
        >
          Zone: {zone.name}
        </div>
      ))}
    </>
  );
};