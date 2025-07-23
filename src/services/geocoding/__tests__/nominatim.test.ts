import { NominatimGeocoder } from '../nominatim';
import type { SearchResult, SearchOptions } from '@/components/SearchInput/types';

// Mock fetch
global.fetch = jest.fn();

describe('NominatimGeocoder', () => {
  let geocoder: NominatimGeocoder;

  beforeEach(() => {
    geocoder = new NominatimGeocoder();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should use default base URL', () => {
      const geocoder = new NominatimGeocoder();
      expect(geocoder).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const customUrl = 'https://custom-nominatim.example.com';
      const geocoder = new NominatimGeocoder({ baseUrl: customUrl });
      expect(geocoder).toBeDefined();
    });

    it('should include email in User-Agent when provided', () => {
      const geocoder = new NominatimGeocoder({ email: 'test@example.com' });
      expect(geocoder).toBeDefined();
    });
  });

  describe('search()', () => {
    const mockNominatimResponse = [
      {
        place_id: 101122771,
        osm_type: 'relation',
        osm_id: 71525,
        display_name: 'Paris, Île-de-France, France métropolitaine, France',
        lat: '48.8565906',
        lon: '2.3514992',
        boundingbox: ['48.815573', '48.902145', '2.224199', '2.469920'],
        class: 'boundary',
        type: 'administrative',
        importance: 0.96893459932191,
        address: {
          city: 'Paris',
          state: 'Île-de-France',
          country: 'France',
          country_code: 'fr'
        }
      },
      {
        place_id: 12345,
        osm_type: 'node',
        osm_id: 67890,
        display_name: '10001, New York, NY, USA',
        lat: '40.7506',
        lon: '-73.9971',
        boundingbox: ['40.74', '40.76', '-74.00', '-73.99'],
        class: 'place',
        type: 'postcode',
        importance: 0.8,
        address: {
          postcode: '10001',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          country_code: 'us'
        }
      }
    ];

    it('should search with basic query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNominatimResponse
      });

      const results = await geocoder.search('Paris');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://nominatim.openstreetmap.org/search?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': expect.stringContaining('LeafletZoneSelector/1.0')
          })
        })
      );

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('q=Paris');
      expect(url).toContain('format=json');
      expect(url).toContain('addressdetails=1');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        displayName: 'Paris, Île-de-France, France métropolitaine, France',
        center: [2.3514992, 48.8565906],
        type: 'city'
      });
    });

    it('should parse address components correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNominatimResponse
      });

      const results = await geocoder.search('Paris');

      expect(results[0].address).toEqual({
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France'
      });

      expect(results[1].address).toEqual({
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      });
    });

    it('should respect limit option', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNominatimResponse
      });

      await geocoder.search('Paris', { limit: 3 });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('limit=3');
    });

    it('should handle bounding box restriction', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const boundingBox: [number, number, number, number] = [2.0, 48.0, 3.0, 49.0];
      await geocoder.search('Paris', { boundingBox });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('viewbox=2%2C48%2C3%2C49');
      expect(url).toContain('bounded=1');
    });

    it('should handle country codes restriction', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await geocoder.search('Paris', { countryCodes: ['FR', 'DE'] });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('countrycodes=FR%2CDE');
    });

    it('should handle language option', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await geocoder.search('Paris', { language: 'fr' });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('accept-language=fr');
    });

    it('should pass abort signal', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const controller = new AbortController();
      await geocoder.search('Paris', { signal: controller.signal });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal
        })
      );
    });

    it('should throw error on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Too Many Requests'
      });

      await expect(geocoder.search('Paris')).rejects.toThrow('Geocoding failed: Too Many Requests');
    });

    it('should identify place types correctly', async () => {
      const typeTestCases = [
        {
          response: { ...mockNominatimResponse[0], type: 'city', class: 'place' },
          expectedType: 'city'
        },
        {
          response: { ...mockNominatimResponse[0], type: 'town', class: 'place' },
          expectedType: 'city'
        },
        {
          response: { ...mockNominatimResponse[0], type: 'village', class: 'place' },
          expectedType: 'city'
        },
        {
          response: { 
            ...mockNominatimResponse[0], 
            display_name: '10001',
            address: { postcode: '10001' }
          },
          expectedType: 'postalcode'
        },
        {
          response: { ...mockNominatimResponse[0], class: 'amenity' },
          expectedType: 'poi'
        },
        {
          response: { ...mockNominatimResponse[0], class: 'shop' },
          expectedType: 'poi'
        }
      ];

      for (const testCase of typeTestCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [testCase.response]
        });

        const results = await geocoder.search('test');
        expect(results[0].type).toBe(testCase.expectedType);
      }
    });
  });

  describe('reverse()', () => {
    const mockReverseResponse = {
      place_id: 101122771,
      osm_type: 'relation',
      osm_id: 71525,
      display_name: 'Paris, Île-de-France, France',
      lat: '48.8565906',
      lon: '2.3514992',
      boundingbox: ['48.815573', '48.902145', '2.224199', '2.469920'],
      address: {
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France'
      }
    };

    it('should perform reverse geocoding', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReverseResponse
      });

      const result = await geocoder.reverse([2.3514992, 48.8565906]);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://nominatim.openstreetmap.org/reverse?'),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('lat=48.8565906');
      expect(url).toContain('lon=2.3514992');
      expect(url).toContain('format=json');
      expect(url).toContain('addressdetails=1');

      expect(result).toMatchObject({
        displayName: 'Paris, Île-de-France, France',
        center: [2.3514992, 48.8565906]
      });
    });

    it('should return null when no result found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Unable to geocode' })
      });

      const result = await geocoder.reverse([0, 0]);
      expect(result).toBeNull();
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(geocoder.reverse([0, 0])).rejects.toThrow('Reverse geocoding failed: Bad Request');
    });
  });

  describe('Custom configuration', () => {
    it('should use custom base URL', async () => {
      const customGeocoder = new NominatimGeocoder({
        baseUrl: 'https://custom.nominatim.com'
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await customGeocoder.search('test');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('https://custom.nominatim.com/search?');
    });

    it('should include email in User-Agent header', async () => {
      const customGeocoder = new NominatimGeocoder({
        email: 'admin@example.com'
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await customGeocoder.search('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'LeafletZoneSelector/1.0 (admin@example.com)'
          })
        })
      );
    });
  });
});