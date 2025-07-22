import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SearchInputProps, NominatimResult, SearchError } from './types';
import {
  NOMINATIM_BASE_URL,
  debounce,
  canMakeRequest,
  updateLastRequestTime,
  getRecentSearches,
  saveRecentSearch,
  isValidPostalCode
} from './utils';
import './SearchInput.css';

export const SearchInput: React.FC<SearchInputProps> = ({
  onLocationSelect,
  placeholder = 'Search for a city or postal code...',
  debounceMs = 300,
  maxResults = 5,
  className = '',
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showRecent, setShowRecent] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsId = useRef(`search-results-${Math.random().toString(36).substr(2, 9)}`);
  
  // Fetch locations from Nominatim API
  const searchLocations = useCallback(async (searchQuery: string) => {
    // Validate query length
    if (searchQuery.length < 3 && !isValidPostalCode(searchQuery)) {
      setError(SearchError.INVALID_QUERY);
      setResults([]);
      setLoading(false);
      return;
    }
    
    // Check rate limiting
    if (!canMakeRequest()) {
      setError(SearchError.RATE_LIMIT);
      setLoading(false);
      return;
    }
    
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: maxResults.toString(),
        'accept-language': navigator.language
      });
      
      updateLastRequestTime();
      
      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'User-Agent': 'LeafletZoneSelector/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          setError(SearchError.RATE_LIMIT);
        } else {
          setError(SearchError.NETWORK);
        }
        setResults([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setError(SearchError.NO_RESULTS);
        setResults([]);
      } else {
        setError(null);
        setResults(data.slice(0, maxResults));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(SearchError.NETWORK);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [maxResults]);
  
  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(searchLocations, debounceMs),
    [searchLocations, debounceMs]
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setLoading(true);
      setShowResults(true);
      setShowRecent(false);
      setError(null);
      debouncedSearch(value.trim());
    } else {
      setResults([]);
      setShowResults(false);
      setError(null);
      setLoading(false);
    }
  };
  
  // Handle clear button
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };
  
  // Handle result selection
  const handleSelectResult = (result: NominatimResult) => {
    onLocationSelect(result);
    saveRecentSearch({
      display_name: result.display_name,
      lat: result.lat,
      lon: result.lon
    });
    handleClear();
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || (results.length === 0 && !showRecent)) return;
    
    const items = showRecent ? getRecentSearches() : results;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < items.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          if (showRecent) {
            const recent = items[selectedIndex] as any;
            // Convert recent search to NominatimResult format
            handleSelectResult({
              place_id: 0,
              osm_type: 'node',
              osm_id: 0,
              display_name: recent.display_name,
              lat: recent.lat,
              lon: recent.lon,
              boundingbox: [],
              type: 'recent',
              importance: 0
            } as NominatimResult);
          } else {
            handleSelectResult(results[selectedIndex]);
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
        
      case 'Tab':
        if (selectedIndex === -1 && items.length > 0) {
          e.preventDefault();
          setSelectedIndex(0);
        }
        break;
    }
  };
  
  // Handle input focus
  const handleInputFocus = () => {
    if (!query && getRecentSearches().length > 0) {
      setShowRecent(true);
      setShowResults(true);
    }
  };
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        resultsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const recentSearches = useMemo(() => getRecentSearches(), [showRecent]);
  const hasResults = results.length > 0 || (showRecent && recentSearches.length > 0);
  
  return (
    <div className={`search-input-container ${className}`}>
      <input
        ref={inputRef}
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={showResults ? resultsId.current : undefined}
        aria-activedescendant={
          selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
        }
      />
      
      {query && (
        <button
          className="search-input-clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          ×
        </button>
      )}
      
      {showResults && (
        <div
          ref={resultsRef}
          className="search-results"
          id={resultsId.current}
          role="listbox"
        >
          {loading && (
            <div className="search-loading">
              <span className="search-spinner" aria-hidden="true" />
              <span className="sr-only">Loading...</span>
              Loading...
            </div>
          )}
          
          {!loading && error && (
            <div className="search-error" role="alert">
              {error}
            </div>
          )}
          
          {!loading && !error && showRecent && recentSearches.length > 0 && (
            <>
              <div className="search-recent-header">Recent searches</div>
              <ul className="search-results-list">
                {recentSearches.map((recent, index) => (
                  <li
                    key={index}
                    className="search-result-item"
                    role="option"
                    aria-selected={selectedIndex === index}
                    id={`search-result-${index}`}
                    onClick={() => handleSelectResult({
                      place_id: 0,
                      osm_type: 'node',
                      osm_id: 0,
                      display_name: recent.display_name,
                      lat: recent.lat,
                      lon: recent.lon,
                      boundingbox: [],
                      type: 'recent',
                      importance: 0
                    } as NominatimResult)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    tabIndex={selectedIndex === index ? 0 : -1}
                  >
                    {recent.display_name}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {!loading && !error && !showRecent && results.length > 0 && (
            <ul className="search-results-list">
              {results.map((result, index) => (
                <li
                  key={result.place_id}
                  className="search-result-item"
                  role="option"
                  aria-selected={selectedIndex === index}
                  id={`search-result-${index}`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  tabIndex={selectedIndex === index ? 0 : -1}
                >
                  {result.display_name}
                </li>
              ))}
            </ul>
          )}
          
          {(hasResults || error) && (
            <div className="search-attribution">
              <small>
                Data © <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenStreetMap
                </a> contributors
              </small>
            </div>
          )}
        </div>
      )}
      
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!loading && results.length > 0 && `${results.length} results available`}
      </div>
    </div>
  );
};

export type { SearchInputProps, NominatimResult } from './types';