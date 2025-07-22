import type { LatLngBoundsExpression } from 'leaflet';

interface SearchInputProps {
  onLocationFound: (location: { center: [number, number]; bounds?: LatLngBoundsExpression }) => void;
}

// Mock implementation for testing
export const SearchInput = ({ onLocationFound }: SearchInputProps) => {
  return (
    <div data-testid="search-input">
      <input 
        type="text" 
        placeholder="Search location..."
        onChange={(e) => {
          // Mock location search
          if (e.target.value) {
            onLocationFound({ center: [48.8566, 2.3522] });
          }
        }}
      />
    </div>
  );
};