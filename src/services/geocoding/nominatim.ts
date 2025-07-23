import type { GeocodingService, SearchResult, SearchOptions } from '@/components/SearchInput/types';
import type { Coordinates } from '@/types/geography';

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
      'accept-language': options?.language || navigator.language
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
  
  private parseNominatimResult = (result: any): SearchResult => {
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
    const osmDetailType = result.type;
    
    if (result.address?.postcode === result.display_name) {
      return 'postalcode';
    }
    
    if (['city', 'town', 'village'].includes(osmDetailType)) {
      return 'city';
    }
    
    if (osmType === 'boundary' && osmDetailType === 'administrative') {
      // Administrative boundaries are often cities
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