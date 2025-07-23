import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SearchIcon, ClearIcon, SpinnerIcon } from '../Icons';
import { SearchDropdown } from './SearchDropdown';
import { NominatimGeocoder } from '@/services/geocoding/nominatim';
import { useDebounce } from '@/hooks/useDebounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { SearchInputProps, SearchResult, NominatimResult, GeocodingService } from './types';
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
  dropdownClassName,
  // Legacy props
  onLocationSelect,
  maxResults,
  disabled = false
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
        limit: maxSuggestions || maxResults,
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
  }, [geocoder, maxSuggestions, maxResults, boundingBox, countryCodes, onSearchStart, onSearchEnd, onError]);
  
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
      setSuggestions(recentSearches.slice(0, maxSuggestions || maxResults || 5));
      setIsOpen(true);
    }
  };
  
  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setQuery(result.displayName);
    setIsOpen(false);
    
    // Call new callback
    onLocationFound?.(result);
    
    // Call legacy callback if provided
    if (onLocationSelect) {
      const nominatimResult: NominatimResult = {
        place_id: 0,
        osm_type: 'node',
        osm_id: 0,
        display_name: result.displayName,
        lat: String(result.center[1]),
        lon: String(result.center[0]),
        boundingbox: result.bounds ? result.bounds.map(String) : [],
        type: result.type,
        importance: 0,
        address: result.address
      };
      onLocationSelect(nominatimResult);
    }
    
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
              setSuggestions(recentSearches.slice(0, maxSuggestions || maxResults || 5));
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
          disabled={disabled}
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
          query={query}
        />
      )}
    </div>
  );
};