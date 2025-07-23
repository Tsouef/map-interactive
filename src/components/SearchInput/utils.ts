import { PostalCodePatterns } from './types';

export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const POSTAL_PATTERNS: PostalCodePatterns = {
  US: /^\d{5}(-\d{4})?$/,
  UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  FR: /^\d{5}$/,
  DE: /^\d{5}$/,
  CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
  JP: /^\d{3}-\d{4}$/,
  AU: /^\d{4}$/,
  NL: /^\d{4} ?[A-Z]{2}$/i,
  IT: /^\d{5}$/,
  ES: /^\d{5}$/,
  CH: /^\d{4}$/,
  AT: /^\d{4}$/,
  BE: /^\d{4}$/,
  DK: /^\d{4}$/,
  SE: /^\d{3} ?\d{2}$/,
  NO: /^\d{4}$/,
  FI: /^\d{5}$/,
  BR: /^\d{5}-?\d{3}$/,
  MX: /^\d{5}$/,
  AR: /^[A-Z]\d{4}[A-Z]{3}$/,
  IN: /^\d{6}$/,
  CN: /^\d{6}$/,
  RU: /^\d{6}$/,
  ZA: /^\d{4}$/,
  SG: /^\d{6}$/,
  NZ: /^\d{4}$/,
  IE: /^[A-Z]\d{2} ?[A-Z\d]{4}$/i
};

export function isValidPostalCode(query: string): boolean {
  return Object.values(POSTAL_PATTERNS).some(pattern => pattern.test(query.trim()));
}

export function debounce<T extends unknown[], R>(
  func: (...args: T) => R,
  wait: number
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: unknown, ...args: T) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

export function canMakeRequest(): boolean {
  const now = Date.now();
  // Allow first request without rate limiting
  if (lastRequestTime === 0) return true;
  return now - lastRequestTime >= MIN_REQUEST_INTERVAL;
}

export function updateLastRequestTime(): void {
  lastRequestTime = Date.now();
}

// For testing purposes
export function resetRateLimiter(): void {
  lastRequestTime = 0;
}

// Local storage helpers
const RECENT_SEARCHES_KEY = 'leaflet-zone-selector-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  display_name: string;
  lat: string;
  lon: string;
}

export function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(search: RecentSearch): void {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(r => r.display_name !== search.display_name);
    const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
}