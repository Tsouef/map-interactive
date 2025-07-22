# Issue #10: Build SearchInput Component with Geocoding

**Labels**: component, search, geocoding, low-priority

## Description

Create a search input component that allows users to search for locations by address, postal code, or place name using Nominatim (OpenStreetMap's geocoding service) with autocomplete functionality.

## Acceptance Criteria

- [ ] Search input with autocomplete dropdown
- [ ] Search by address, postal code, or place name
- [ ] Debounced API requests
- [ ] Loading and error states
- [ ] Keyboard navigation support
- [ ] Recent searches history
- [ ] Clear search functionality
- [ ] Mobile-friendly interface

## Technical Implementation

### Component Interface
```typescript
// src/components/SearchInput/types.ts
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
```

### Main Component
```tsx
// src/components/SearchInput/SearchInput.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NominatimGeocoder } from '@/services/geocoding/nominatim';
import { SearchIcon, ClearIcon, SpinnerIcon } from '../Icons';
import { SearchDropdown } from './SearchDropdown';
import type { SearchInputProps, SearchResult } from './types';
import './SearchInput.css';

const DEFAULT_GEOCODER = new NominatimGeocoder();

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search for address or place...',
  debounceMs = 300,
  maxSuggestions = 5,
  boundingBox,
  countryCodes,
  enableHistory = true,
  geocoder = DEFAULT_GEOCODER,
  position = 'topright',
  onLocationFound,
  onSearchStart,
  onSearchEnd,
  onError,
  className,
  inputClassName,
  dropdownClassName
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useLocalStorage<SearchResult[]>(
    'leaflet-zone-selector-recent-searches',
    [],
    { maxItems: 10 }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController>();
  
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Close dropdown on outside click
  useClickOutside(containerRef, () => setIsOpen(false));
  
  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    onSearchStart?.();
    
    try {
      const results = await geocoder.search(searchQuery, {
        limit: maxSuggestions,
        boundingBox,
        countryCodes,
        signal: abortControllerRef.current.signal
      });
      
      setSuggestions(results);
      setIsOpen(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        onError?.(error as Error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
      onSearchEnd?.();
    }
  }, [geocoder, maxSuggestions, boundingBox, countryCodes, onSearchStart, onSearchEnd, onError]);
  
  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, performSearch]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    
    if (!e.target.value && enableHistory) {
      setSuggestions(recentSearches.slice(0, maxSuggestions));
      setIsOpen(true);
    }
  };
  
  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setQuery(result.displayName);
    setIsOpen(false);
    onLocationFound?.(result);
    
    // Add to recent searches
    if (enableHistory) {
      const updated = [
        result,
        ...recentSearches.filter(r => r.displayName !== result.displayName)
      ].slice(0, 10);
      setRecentSearches(updated);
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = suggestions.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % total);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + total) % total);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };
  
  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };
  
  const showClearButton = query.length > 0;
  const showDropdown = isOpen && (suggestions.length > 0 || (enableHistory && !query && recentSearches.length > 0));
  
  return (
    <div 
      ref={containerRef}
      className={`leaflet-search-control leaflet-search-${position} ${className || ''}`}
    >
      <div className="leaflet-search-input-wrapper">
        <SearchIcon className="leaflet-search-icon" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!query && enableHistory && recentSearches.length > 0) {
              setSuggestions(recentSearches.slice(0, maxSuggestions));
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`leaflet-search-input ${inputClassName || ''}`}
          aria-label="Search for location"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          role="combobox"
        />
        
        {isLoading && <SpinnerIcon className="leaflet-search-spinner" />}
        
        {showClearButton && !isLoading && (
          <button
            onClick={handleClear}
            className="leaflet-search-clear"
            aria-label="Clear search"
            type="button"
          >
            <ClearIcon />
          </button>
        )}
      </div>
      
      {showDropdown && (
        <SearchDropdown
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onHover={setSelectedIndex}
          isHistory={!query && enableHistory}
          className={dropdownClassName}
        />
      )}
    </div>
  );
};
```

### Nominatim Geocoding Service
```typescript
// src/services/geocoding/nominatim.ts
import type { GeocodingService, SearchResult, SearchOptions } from '@/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export class NominatimGeocoder implements GeocodingService {
  private baseUrl: string;
  private headers: HeadersInit;
  
  constructor(options?: {
    baseUrl?: string;
    email?: string; // For heavy usage
  }) {
    this.baseUrl = options?.baseUrl || NOMINATIM_URL;
    this.headers = {
      'Accept': 'application/json',
      'User-Agent': 'LeafletZoneSelector/1.0' + (options?.email ? ` (${options.email})` : '')
    };
  }
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: String(options?.limit || 5),
      'accept-language': options?.language || 'en'
    });
    
    if (options?.boundingBox) {
      const [minLon, minLat, maxLon, maxLat] = options.boundingBox;
      params.append('viewbox', `${minLon},${minLat},${maxLon},${maxLat}`);
      params.append('bounded', '1');
    }
    
    if (options?.countryCodes) {
      params.append('countrycodes', options.countryCodes.join(','));
    }
    
    const response = await fetch(
      `${this.baseUrl}/search?${params}`,
      {
        headers: this.headers,
        signal: options?.signal
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map(this.parseNominatimResult);
  }
  
  async reverse(coordinates: Coordinates): Promise<SearchResult | null> {
    const params = new URLSearchParams({
      lat: String(coordinates[1]),
      lon: String(coordinates[0]),
      format: 'json',
      addressdetails: '1'
    });
    
    const response = await fetch(
      `${this.baseUrl}/reverse?${params}`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      return null;
    }
    
    return this.parseNominatimResult(data);
  }
  
  private parseNominatimResult(result: any): SearchResult {
    const [minLat, maxLat, minLon, maxLon] = result.boundingbox.map(Number);
    
    return {
      displayName: result.display_name,
      center: [Number(result.lon), Number(result.lat)],
      bounds: [minLon, minLat, maxLon, maxLat],
      address: {
        street: result.address?.road,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        country: result.address?.country,
        postalCode: result.address?.postcode
      },
      type: this.getPlaceType(result),
      raw: result
    };
  }
  
  private getPlaceType(result: any): SearchResult['type'] {
    const osmType = result.class;
    
    if (result.address?.postcode === result.display_name) {
      return 'postalcode';
    }
    
    if (['city', 'town', 'village'].includes(result.type)) {
      return 'city';
    }
    
    if (osmType === 'place') {
      return 'address';
    }
    
    if (osmType === 'amenity' || osmType === 'shop') {
      return 'poi';
    }
    
    return 'address';
  }
}
```

### Search Dropdown Component
```tsx
// src/components/SearchInput/SearchDropdown.tsx
import React from 'react';
import { LocationIcon, HistoryIcon } from '../Icons';
import type { SearchResult } from './types';

interface SearchDropdownProps {
  suggestions: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
  isHistory?: boolean;
  className?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  isHistory = false,
  className
}) => {
  return (
    <div 
      id="search-suggestions"
      className={`leaflet-search-dropdown ${className || ''}`}
      role="listbox"
    >
      {isHistory && (
        <div className="leaflet-search-dropdown-header">
          Recent searches
        </div>
      )}
      
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.displayName}-${index}`}
          className={`leaflet-search-suggestion ${
            index === selectedIndex ? 'selected' : ''
          }`}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => onHover(index)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="leaflet-search-suggestion-icon">
            {isHistory ? <HistoryIcon /> : <LocationIcon />}
          </div>
          
          <div className="leaflet-search-suggestion-content">
            <div className="leaflet-search-suggestion-name">
              {highlightMatch(suggestion.displayName, isHistory ? '' : query)}
            </div>
            {suggestion.address && (
              <div className="leaflet-search-suggestion-address">
                {formatAddress(suggestion.address)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i}>{part}</mark>
      : part
  );
}

function formatAddress(address: SearchResult['address']): string {
  if (!address) return '';
  
  const parts = [
    address.city,
    address.state,
    address.postalCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

## Testing Requirements

- [ ] Search returns relevant results
- [ ] Debouncing prevents excessive API calls
- [ ] Keyboard navigation works correctly
- [ ] Recent searches saved and displayed
- [ ] Error handling for failed requests
- [ ] Accessibility features work
- [ ] Mobile interface responsive
- [ ] Clear button functions properly

## Styling

```css
/* src/components/SearchInput/SearchInput.css */
.leaflet-search-control {
  position: absolute;
  z-index: 1000;
  width: 300px;
  max-width: 90%;
}

.leaflet-search-topright {
  top: 10px;
  right: 10px;
}

.leaflet-search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.2);
}

.leaflet-search-input {
  flex: 1;
  border: none;
  padding: 8px 32px;
  font-size: 14px;
  outline: none;
  background: transparent;
}

.leaflet-search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-height: 300px;
  overflow-y: auto;
}

/* Dark theme support */
.dark .leaflet-search-control {
  --bg-color: #1f2937;
  --text-color: #f3f4f6;
  --border-color: #374151;
}
```

## Related Issues

- #4: Integration with main component
- #25: Geocoding API integration
- #28: Keyboard navigation support
- #27: Loading states implementation