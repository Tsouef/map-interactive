import type { Coordinates } from '@/types/geography';

export interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  
  /** Search delay in ms */
  debounceMs?: number;
  
  /** Maximum suggestions to show */
  maxSuggestions?: number;
  
  /** Restrict search to bounds */
  boundingBox?: BoundingBox;
  
  /** Restrict search to countries (ISO codes) */
  countryCodes?: string[];
  
  /** Enable recent searches */
  enableHistory?: boolean;
  
  /** Custom geocoding service */
  geocoder?: GeocodingService;
  
  /** Position of search box */
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  
  /** Callbacks */
  onLocationFound?: (location: SearchResult) => void;
  onSearchStart?: () => void;
  onSearchEnd?: () => void;
  onError?: (error: Error) => void;
  
  /** Styling */
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  
  /** Legacy compatibility */
  onLocationSelect?: (location: NominatimResult) => void;
  maxResults?: number;
  disabled?: boolean;
}

export interface SearchResult {
  /** Display name */
  displayName: string;
  
  /** Location coordinates */
  center: Coordinates;
  
  /** Bounding box of result */
  bounds?: BoundingBox;
  
  /** Address components */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  /** Place type */
  type: 'address' | 'city' | 'postalcode' | 'poi' | 'country';
  
  /** Original data from geocoder */
  raw?: any;
}

export interface GeocodingService {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  reverse(coordinates: Coordinates): Promise<SearchResult | null>;
}

export interface SearchOptions {
  limit?: number;
  boundingBox?: BoundingBox;
  countryCodes?: string[];
  language?: string;
  signal?: AbortSignal;
}

export type BoundingBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

// Legacy types for backward compatibility
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
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
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