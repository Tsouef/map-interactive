export interface SearchInputProps {
  onLocationSelect: (location: NominatimResult) => void;
  placeholder?: string;
  debounceMs?: number;
  maxResults?: number;
  className?: string;
  disabled?: boolean;
}

export interface NominatimResult {
  place_id: number;
  osm_type: 'way' | 'relation' | 'node';
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  type: string;
  importance: number;
}

export enum SearchError {
  RATE_LIMIT = 'Please wait before searching again',
  NETWORK = 'Unable to connect to search service',
  NO_RESULTS = 'No locations found',
  INVALID_QUERY = 'Please enter at least 3 characters'
}

export interface PostalCodePatterns {
  [country: string]: RegExp;
}