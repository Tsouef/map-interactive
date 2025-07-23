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
  query?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  isHistory = false,
  className,
  query = ''
}) => {
  return (
    <div 
      id="search-suggestions"
      className={`leaflet-search-dropdown ${className || ''}`}
      role="listbox"
    >
      <div className="leaflet-search-dropdown-inner">
        {isHistory && (
          <div className="leaflet-search-dropdown-header">
            Recent searches
          </div>
        )}
        
        {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.displayName}-${index}`}
          data-key={`${suggestion.displayName}-${index}`}
          className={`leaflet-search-suggestion ${
            index === selectedIndex ? 'selected' : ''
          }`}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => onHover(index)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="leaflet-search-suggestion-icon">
            {isHistory ? <HistoryIcon aria-label="Recent search" /> : <LocationIcon aria-label="Location" />}
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