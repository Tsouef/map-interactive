import {
  fetchCityBoundary,
  searchLocation,
  OSMCache,
  fetchDistrictBoundaries,
  getOverpassQuery,
  parseOverpassResponse,
  nominatimSearch,
  parseNominatimResponse
} from '../osmUtils';

// Mock fetch for testing
global.fetch = jest.fn();

describe('osmUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any cache instances
    OSMCache.getInstance().clear();
  });

  describe('fetchCityBoundary', () => {
    it('should fetch city boundary from Overpass API', async () => {
      const mockNominatimResponse = {
        features: [{
          properties: {
            place_id: 123456,
            osm_type: 'relation',
            osm_id: 123456,
            display_name: 'Paris, France',
            boundingbox: ['48.815', '48.902', '2.224', '2.469']
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.224, 48.815], [2.469, 48.815], [2.469, 48.902], [2.224, 48.902], [2.224, 48.815]]]
          }
        }]
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNominatimResponse
        });

      const zone = await fetchCityBoundary('Paris');
      
      expect(zone).toMatchObject({
        id: expect.stringMatching(/^osm-/),
        name: 'Paris',
        geometry: {
          type: 'Polygon',
          coordinates: expect.any(Array)
        },
        metadata: {
          source: 'osm'
        }
      });

      // Check that fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );
    });

    it('should handle city not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] })
      });

      await expect(fetchCityBoundary('NonexistentCity')).rejects.toThrow('City not found');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchCityBoundary('Paris')).rejects.toThrow('Network error');
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = {
        features: [{
          properties: {
            place_id: 123456,
            display_name: 'Paris, France',
            boundingbox: ['48.815', '48.902', '2.224', '2.469']
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.224, 48.815], [2.469, 48.815], [2.469, 48.902], [2.224, 48.902], [2.224, 48.815]]]
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      await fetchCityBoundary('Paris');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await fetchCityBoundary('Paris');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchLocation', () => {
    it('should search locations using Nominatim', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              place_id: 1,
              display_name: '75001 Paris, France',
              lat: '48.860',
              lon: '2.340',
              boundingbox: ['48.855', '48.865', '2.335', '2.345']
            },
            geometry: {
              type: 'Point',
              coordinates: [2.340, 48.860]
            }
          },
          {
            properties: {
              place_id: 2,
              display_name: '75002 Paris, France',
              lat: '48.865',
              lon: '2.345',
              boundingbox: ['48.860', '48.870', '2.340', '2.350']
            },
            geometry: {
              type: 'Point',
              coordinates: [2.345, 48.865]
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await searchLocation('75001');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: expect.any(String),
        name: '75001 Paris, France',
        center: [2.340, 48.860],
        bbox: [2.335, 48.855, 2.345, 48.865]
      });
    });

    it('should handle empty search results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] })
      });

      const results = await searchLocation('xyz123');
      expect(results).toEqual([]);
    });

    it('should respect rate limiting', async () => {
      const mockResponse = [{
        place_id: 1,
        display_name: 'Test Location',
        lat: '0',
        lon: '0'
      }];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Make multiple requests quickly
      const startTime = Date.now();
      await searchLocation('test1');
      await searchLocation('test2');
      await searchLocation('test3');
      const endTime = Date.now();

      // Should take at least 2 seconds for 3 requests (rate limit: 1/sec)
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('fetchDistrictBoundaries', () => {
    it('should fetch district boundaries for a city', async () => {
      // Mock city boundary fetch first
      const mockCityResponse = {
        features: [{
          properties: {
            place_id: 123456,
            display_name: 'Paris, France',
            boundingbox: ['48.815', '48.902', '2.224', '2.469']
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.224, 48.815], [2.469, 48.815], [2.469, 48.902], [2.224, 48.902], [2.224, 48.815]]]
          }
        }]
      };

      const mockOverpassResponse = {
        elements: [
          {
            type: 'relation',
            id: 1,
            tags: {
              name: '1er arrondissement',
              admin_level: '9'
            },
            bounds: {
              minlat: 48.855,
              minlon: 2.330,
              maxlat: 48.867,
              maxlon: 2.350
            }
          },
          {
            type: 'relation',
            id: 2,
            tags: {
              name: '2e arrondissement',
              admin_level: '9'
            },
            bounds: {
              minlat: 48.863,
              minlon: 2.340,
              maxlat: 48.870,
              maxlon: 2.355
            }
          }
        ]
      };

      // Mock Nominatim for fetching geometries
      const mockNominatimResponses = [
        {
          features: [{
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[[2.330, 48.855], [2.350, 48.855], [2.350, 48.867], [2.330, 48.867], [2.330, 48.855]]]
            }
          }]
        },
        {
          features: [{
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[[2.340, 48.863], [2.355, 48.863], [2.355, 48.870], [2.340, 48.870], [2.340, 48.863]]]
            }
          }]
        }
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCityResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOverpassResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNominatimResponses[0]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNominatimResponses[1]
        });

      const districts = await fetchDistrictBoundaries('Paris', 'France');
      
      expect(districts).toHaveLength(2);
      expect(districts[0]).toMatchObject({
        id: expect.stringMatching(/^osm-/),
        name: '1er arrondissement',
        geometry: {
          type: 'Polygon'
        }
      });
    });

    it('should handle cities without districts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] })
      });

      const districts = await fetchDistrictBoundaries('SmallTown', 'Country');
      expect(districts).toEqual([]);
    });
  });

  describe('OSMCache', () => {
    it('should cache and retrieve values', () => {
      const cache = OSMCache.getInstance();
      const testData = { id: 'test', name: 'Test Zone' };
      
      cache.set('test-key', testData);
      expect(cache.get('test-key')).toEqual(testData);
    });

    it('should expire old entries', async () => {
      const cache = OSMCache.getInstance();
      const testData = { id: 'test', name: 'Test Zone' };
      
      // Set with 100ms TTL
      cache.set('test-key', testData, 100);
      expect(cache.get('test-key')).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('test-key')).toBeNull();
    });

    it('should enforce size limits', () => {
      const cache = OSMCache.getInstance();
      cache.clear();
      
      // Add many items (assuming default max size is 100)
      for (let i = 0; i < 150; i++) {
        cache.set(`key-${i}`, { data: i });
      }
      
      // Check that cache size is limited
      expect(cache.size()).toBeLessThanOrEqual(100);
      
      // Check that recent items are kept
      expect(cache.get('key-149')).toBeTruthy();
      expect(cache.get('key-0')).toBeNull();
    });

    it('should be a singleton', () => {
      const cache1 = OSMCache.getInstance();
      const cache2 = OSMCache.getInstance();
      expect(cache1).toBe(cache2);
    });
  });

  describe('getOverpassQuery', () => {
    it('should generate correct query for city boundaries', () => {
      const query = getOverpassQuery('city', { name: 'Paris', country: 'France' });
      
      expect(query).toContain('[out:json]');
      expect(query).toContain('relation["boundary"="administrative"]');
      expect(query).toContain('["name"="Paris"]');
      expect(query).toContain('["admin_level"~"6|7|8"]');
    });

    it('should generate correct query for districts', () => {
      const query = getOverpassQuery('district', { 
        city: 'Paris',
        bbox: [2.224, 48.815, 2.469, 48.902]
      });
      
      expect(query).toContain('(48.815,2.224,48.902,2.469)');
      expect(query).toContain('["admin_level"~"9|10"]');
    });
  });

  describe('parseOverpassResponse', () => {
    it('should parse valid Overpass response', () => {
      const response = {
        elements: [{
          type: 'relation',
          id: 123,
          tags: {
            name: 'Test Area',
            admin_level: '8'
          },
          bounds: {
            minlat: 48.8,
            minlon: 2.3,
            maxlat: 48.9,
            maxlon: 2.4
          }
        }]
      };

      const parsed = parseOverpassResponse(response);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        id: 123,
        name: 'Test Area',
        bounds: {
          minlat: 48.8,
          minlon: 2.3,
          maxlat: 48.9,
          maxlon: 2.4
        }
      });
    });

    it('should handle empty response', () => {
      const parsed = parseOverpassResponse({ elements: [] });
      expect(parsed).toEqual([]);
    });
  });

  describe('nominatimSearch', () => {
    it('should construct correct search URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await nominatimSearch({ q: 'Paris', limit: 5, format: 'geojson' });
      
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('q=Paris');
      expect(url).toContain('limit=5');
      expect(url).toContain('format=geojson');
      expect(url).toContain('polygon_geojson=1');
    });

    it('should handle rate limit errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(async () => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      }));

      await expect(nominatimSearch({ q: 'Test' }))
        .rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('parseNominatimResponse', () => {
    it('should parse GeoJSON response correctly', () => {
      const response = [{
        place_id: 123,
        display_name: 'Paris, France',
        lat: '48.8566',
        lon: '2.3522',
        boundingbox: ['48.815', '48.902', '2.224', '2.469'],
        geojson: {
          type: 'Polygon',
          coordinates: [[[2.224, 48.815], [2.469, 48.815], [2.469, 48.902], [2.224, 48.902], [2.224, 48.815]]]
        }
      }];

      const parsed = parseNominatimResponse(response);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        id: 'osm-123',
        name: 'Paris, France',
        center: [2.3522, 48.8566],
        bbox: [2.224, 48.815, 2.469, 48.902],
        geometry: {
          type: 'Polygon',
          coordinates: expect.any(Array)
        }
      });
    });

    it('should handle responses without geometry', () => {
      const response = [{
        place_id: 123,
        display_name: 'Test Place',
        lat: '0',
        lon: '0',
        boundingbox: ['0', '0', '0', '0']
      }];

      const parsed = parseNominatimResponse(response);
      expect(parsed[0].geometry).toBeUndefined();
    });
  });
});