import type { Zone } from '../types/zone';
import type { Coordinates, BoundingBox } from '../types/geography';
import type { Polygon, MultiPolygon } from 'geojson';

// Interfaces for API responses
interface OverpassElement {
  type: string;
  id: number;
  tags?: {
    name?: string;
    admin_level?: string;
    boundary?: string;
    [key: string]: string | undefined;
  };
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
  members?: Array<{ type: string; ref: number; role: string }>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface NominatimResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  geojson?: Polygon | MultiPolygon;
}

export interface SearchResult {
  id: string;
  name: string;
  center: Coordinates;
  bbox?: BoundingBox;
  geometry?: Polygon | MultiPolygon;
}

// Rate limiting configuration
const RATE_LIMITS = {
  nominatim: 1000, // 1 request per second
  overpass: 2000   // Be conservative with Overpass
};

// API endpoints
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// User agent for API requests (required by OSM)
const USER_AGENT = 'LeafletZoneSelector/1.0 (https://github.com/username/leaflet-zone-selector)';

/**
 * Simple in-memory cache for OSM data
 */
export class OSMCache {
  private static instance: OSMCache;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }>;
  private maxSize: number;
  private lastRequestTime: Map<string, number>;

  private constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.lastRequestTime = new Map();
  }

  static getInstance(): OSMCache {
    if (!OSMCache.instance) {
      OSMCache.instance = new OSMCache();
    }
    return OSMCache.instance;
  }

  set(key: string, data: unknown, ttl: number = 3600000): void { // Default 1 hour
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
    this.lastRequestTime.clear();
  }

  size(): number {
    return this.cache.size;
  }

  async rateLimit(service: 'nominatim' | 'overpass'): Promise<void> {
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(service) || 0;
    const timeSinceLastRequest = now - lastRequest;
    const minInterval = RATE_LIMITS[service];

    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }

    this.lastRequestTime.set(service, Date.now());
  }
}

/**
 * Fetch city boundary from OpenStreetMap
 */
export async function fetchCityBoundary(cityName: string, country?: string): Promise<Zone> {
  const cache = OSMCache.getInstance();
  const cacheKey = `city:${cityName}:${country || ''}`;
  
  // Check cache first
  const cached = cache.get<Zone>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // First, search for the city using Nominatim
    const searchParams: Record<string, string | number> = {
      q: country ? `${cityName}, ${country}` : cityName,
      format: 'geojson',
      limit: 1,
      polygon_geojson: 1
    };

    const searchResults = await nominatimSearch(searchParams);
    
    if (searchResults.length === 0) {
      throw new Error('City not found');
    }

    const result = searchResults[0];
    const parsedResults = parseNominatimResponse([result]);
    
    if (parsedResults.length === 0) {
      throw new Error('City not found');
    }
    
    const parsed = parsedResults[0];

    if (!parsed.geometry) {
      // If Nominatim doesn't return geometry, try Overpass
      const overpassResult = await fetchFromOverpass(cityName, country);
      if (overpassResult) {
        parsed.geometry = overpassResult.geometry;
      }
    }

    const zone: Zone = {
      id: parsed.id,
      name: cityName,
      geometry: parsed.geometry || {
        type: 'Polygon',
        coordinates: [[
          [parsed.bbox![0], parsed.bbox![1]],
          [parsed.bbox![2], parsed.bbox![1]],
          [parsed.bbox![2], parsed.bbox![3]],
          [parsed.bbox![0], parsed.bbox![3]],
          [parsed.bbox![0], parsed.bbox![1]]
        ]]
      },
      bbox: parsed.bbox,
      metadata: {
        source: 'osm',
        lastUpdated: new Date(),
        quality: parsed.geometry ? 'high' : 'medium'
      }
    };

    // Cache the result
    cache.set(cacheKey, zone);
    
    return zone;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch city boundary');
  }
}

/**
 * Search locations using Nominatim
 */
export async function searchLocation(query: string): Promise<SearchResult[]> {
  const cache = OSMCache.getInstance();
  const cacheKey = `search:${query}`;
  
  // Check cache first
  const cached = cache.get<SearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const results = await nominatimSearch({
      q: query,
      format: 'geojson',
      limit: 10,
      polygon_geojson: 1
    });

    const searchResults = parseNominatimResponse(results);
    
    // Cache the results
    cache.set(cacheKey, searchResults);
    
    return searchResults;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * Fetch district boundaries for a city
 */
export async function fetchDistrictBoundaries(cityName: string, country?: string): Promise<Zone[]> {
  const cache = OSMCache.getInstance();
  const cacheKey = `districts:${cityName}:${country || ''}`;
  
  // Check cache first
  const cached = cache.get<Zone[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // First get the city boundary to get the bbox
    const cityZone = await fetchCityBoundary(cityName, country);
    
    if (!cityZone.bbox) {
      return [];
    }

    const query = getOverpassQuery('district', {
      city: cityName,
      bbox: cityZone.bbox
    });

    await cache.rateLimit('overpass');
    
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data: OverpassResponse = await response.json();
    const elements = parseOverpassResponse(data);
    
    // Fetch geometry for each district
    const districts: Zone[] = [];
    
    for (const element of elements) {
      try {
        // Try to get geometry from Nominatim
        const nominatimResults = await nominatimSearch({
          osm_type: 'relation',
          osm_id: element.id,
          format: 'geojson',
          polygon_geojson: 1
        });

        if (nominatimResults.length > 0) {
          const result = nominatimResults[0];
          if (result.geojson) {
            districts.push({
              id: `osm-district-${element.id}`,
              name: element.name,
              geometry: result.geojson,
              bbox: [
                element.bounds.minlon,
                element.bounds.minlat,
                element.bounds.maxlon,
                element.bounds.maxlat
              ],
              metadata: {
                source: 'osm',
                lastUpdated: new Date(),
                quality: 'high'
              }
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch geometry for district ${element.name}:`, error);
      }
    }

    // Cache the results
    cache.set(cacheKey, districts);
    
    return districts;
  } catch (error) {
    console.error('Failed to fetch districts:', error);
    return [];
  }
}

/**
 * Generate Overpass API query
 */
export function getOverpassQuery(
  type: 'city' | 'district',
  params: { name?: string; country?: string; city?: string; bbox?: BoundingBox }
): string {
  let query = '[out:json][timeout:25];';
  
  if (type === 'city') {
    query += `(
      relation["boundary"="administrative"]["name"="${params.name}"]["admin_level"~"6|7|8"];
    );`;
  } else if (type === 'district' && params.bbox) {
    const [minLon, minLat, maxLon, maxLat] = params.bbox;
    query += `(
      relation["boundary"="administrative"]["admin_level"~"9|10"](${minLat},${minLon},${maxLat},${maxLon});
    );`;
  }
  
  query += 'out body; >; out skel qt;';
  
  return query;
}

/**
 * Parse Overpass API response
 */
export function parseOverpassResponse(response: OverpassResponse): Array<{
  id: number;
  name: string;
  bounds: { minlat: number; minlon: number; maxlat: number; maxlon: number };
}> {
  return response.elements
    .filter(el => el.type === 'relation' && el.tags && el.tags.name && el.bounds)
    .map(el => ({
      id: el.id,
      name: el.tags!.name!,
      bounds: el.bounds!
    }));
}

/**
 * Make a request to Nominatim API
 */
export async function nominatimSearch(params: Record<string, string | number>): Promise<NominatimResult[]> {
  const cache = OSMCache.getInstance();
  await cache.rateLimit('nominatim');
  
  const url = new URL(NOMINATIM_API);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  // Always request polygon data
  url.searchParams.set('polygon_geojson', '1');
  
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`Nominatim API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle both regular JSON and GeoJSON format responses
  if (params.format === 'geojson') {
    if (!data.features) {
      return [];
    }
    // Convert GeoJSON FeatureCollection to NominatimResult format
    interface GeoJSONFeature {
      properties: {
        place_id?: number;
        osm_type?: string;
        osm_id?: number;
        display_name?: string;
        lat?: number;
        lon?: number;
        boundingbox?: string[];
      };
      geometry: Polygon | MultiPolygon;
      bbox?: number[];
    }
    
    return data.features.map((feature: GeoJSONFeature) => ({
      place_id: feature.properties.place_id || 0,
      osm_type: feature.properties.osm_type,
      osm_id: feature.properties.osm_id,
      display_name: feature.properties.display_name || '',
      lat: String(feature.properties.lat || 0),
      lon: String(feature.properties.lon || 0),
      boundingbox: feature.properties.boundingbox || (feature.bbox ? feature.bbox.map(String) : []),
      geojson: feature.geometry
    }));
  }
  
  return Array.isArray(data) ? data : [];
}

/**
 * Parse Nominatim response into SearchResult format
 */
export function parseNominatimResponse(results: NominatimResult[]): SearchResult[] {
  return results.filter(result => result && result.place_id).map(result => {
    const searchResult: SearchResult = {
      id: `osm-${result.place_id}`,
      name: result.display_name,
      center: [parseFloat(result.lon), parseFloat(result.lat)] as Coordinates,
      bbox: result.boundingbox ? [
        parseFloat(result.boundingbox[2]), // min lon
        parseFloat(result.boundingbox[0]), // min lat
        parseFloat(result.boundingbox[3]), // max lon
        parseFloat(result.boundingbox[1])  // max lat
      ] as BoundingBox : undefined
    };

    if (result.geojson) {
      searchResult.geometry = result.geojson;
    }

    return searchResult;
  });
}

/**
 * Fetch geometry from Overpass API (fallback)
 */
async function fetchFromOverpass(cityName: string, country?: string): Promise<Zone | null> {
  try {
    const query = getOverpassQuery('city', { name: cityName, country });
    const cache = OSMCache.getInstance();
    await cache.rateLimit('overpass');
    
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      return null;
    }

    const data: OverpassResponse = await response.json();
    const elements = parseOverpassResponse(data);
    
    if (elements.length === 0) {
      return null;
    }

    // For now, return a simple bounding box polygon
    const element = elements[0];
    return {
      id: `osm-${element.id}`,
      name: element.name,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [element.bounds.minlon, element.bounds.minlat],
          [element.bounds.maxlon, element.bounds.minlat],
          [element.bounds.maxlon, element.bounds.maxlat],
          [element.bounds.minlon, element.bounds.maxlat],
          [element.bounds.minlon, element.bounds.minlat]
        ]]
      },
      bbox: [
        element.bounds.minlon,
        element.bounds.minlat,
        element.bounds.maxlon,
        element.bounds.maxlat
      ],
      metadata: {
        source: 'osm',
        quality: 'low' // Just bbox, not full geometry
      }
    };
  } catch (error) {
    console.error('Overpass query failed:', error);
    return null;
  }
}