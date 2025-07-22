import {
  getCityDivisions,
  loadCityDivisions,
  getCachedDivisions,
  clearCache,
  type CityDivision,
  type DivisionData,
  SUPPORTED_CITIES
} from '../cityDivisions';

describe('cityDivisions', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('SUPPORTED_CITIES', () => {
    it('should include all required cities', () => {
      expect(SUPPORTED_CITIES).toContain('paris');
      expect(SUPPORTED_CITIES).toContain('london');
      expect(SUPPORTED_CITIES).toContain('new-york');
      expect(SUPPORTED_CITIES).toContain('tokyo');
      expect(SUPPORTED_CITIES).toContain('berlin');
    });
  });

  describe('getCityDivisions', () => {
    it('should return Paris arrondissements data', async () => {
      const divisions = await getCityDivisions('paris');
      
      expect(divisions).toBeDefined();
      expect(divisions?.cityId).toBe('paris');
      expect(divisions?.cityName).toBe('Paris');
      expect(divisions?.divisions).toHaveLength(20);
      
      const firstArr = divisions?.divisions[0];
      expect(firstArr?.id).toBe('paris-1');
      expect(firstArr?.name).toBe('1er arrondissement');
      expect(firstArr?.coordinates).toBeDefined();
      expect(firstArr?.metadata?.population).toBeGreaterThan(0);
      expect(firstArr?.metadata?.area).toBeGreaterThan(0);
    });

    it('should return London boroughs data', async () => {
      const divisions = await getCityDivisions('london');
      
      expect(divisions).toBeDefined();
      expect(divisions?.cityId).toBe('london');
      expect(divisions?.cityName).toBe('London');
      expect(divisions?.divisions).toHaveLength(33); // 32 boroughs + City of London
      
      const westminster = divisions?.divisions.find(d => d.id === 'london-westminster');
      expect(westminster).toBeDefined();
      expect(westminster?.name).toBe('Westminster');
      expect(westminster?.coordinates).toBeDefined();
    });

    it('should return NYC boroughs data', async () => {
      const divisions = await getCityDivisions('new-york');
      
      expect(divisions).toBeDefined();
      expect(divisions?.cityId).toBe('new-york');
      expect(divisions?.cityName).toBe('New York City');
      expect(divisions?.divisions).toHaveLength(5);
      
      const manhattan = divisions?.divisions.find(d => d.id === 'new-york-manhattan');
      expect(manhattan).toBeDefined();
      expect(manhattan?.name).toBe('Manhattan');
      expect(manhattan?.coordinates).toBeDefined();
    });

    it('should return Tokyo special wards data', async () => {
      const divisions = await getCityDivisions('tokyo');
      
      expect(divisions).toBeDefined();
      expect(divisions?.cityId).toBe('tokyo');
      expect(divisions?.cityName).toBe('Tokyo');
      expect(divisions?.divisions).toHaveLength(23);
      
      const shibuya = divisions?.divisions.find(d => d.id === 'tokyo-shibuya');
      expect(shibuya).toBeDefined();
      expect(shibuya?.name).toBe('Shibuya');
      expect(shibuya?.coordinates).toBeDefined();
    });

    it('should return Berlin districts data', async () => {
      const divisions = await getCityDivisions('berlin');
      
      expect(divisions).toBeDefined();
      expect(divisions?.cityId).toBe('berlin');
      expect(divisions?.cityName).toBe('Berlin');
      expect(divisions?.divisions).toHaveLength(12);
      
      const mitte = divisions?.divisions.find(d => d.id === 'berlin-mitte');
      expect(mitte).toBeDefined();
      expect(mitte?.name).toBe('Mitte');
      expect(mitte?.coordinates).toBeDefined();
    });

    it('should return null for unsupported cities', async () => {
      const divisions = await getCityDivisions('unsupported-city');
      expect(divisions).toBeNull();
    });

    it('should validate coordinate format', async () => {
      const divisions = await getCityDivisions('paris');
      const firstDivision = divisions?.divisions[0];
      
      expect(firstDivision?.coordinates).toBeDefined();
      expect(Array.isArray(firstDivision?.coordinates[0])).toBe(true);
      expect(firstDivision?.coordinates[0][0]).toHaveLength(2);
      expect(typeof firstDivision?.coordinates[0][0][0]).toBe('number'); // longitude
      expect(typeof firstDivision?.coordinates[0][0][1]).toBe('number'); // latitude
    });
  });

  describe('caching mechanism', () => {
    it('should cache loaded city divisions', async () => {
      const spy = jest.spyOn(console, 'log');
      
      // First call - should load
      const divisions1 = await getCityDivisions('paris');
      expect(divisions1).toBeDefined();
      
      // Second call - should use cache
      const divisions2 = await getCityDivisions('paris');
      expect(divisions2).toBe(divisions1);
      
      // Verify same object reference (cached)
      expect(divisions1 === divisions2).toBe(true);
    });

    it('should return cached divisions with getCachedDivisions', async () => {
      // Load Paris first
      await getCityDivisions('paris');
      
      const cached = getCachedDivisions('paris');
      expect(cached).toBeDefined();
      expect(cached?.cityId).toBe('paris');
    });

    it('should return null for non-cached cities', () => {
      const cached = getCachedDivisions('london');
      expect(cached).toBeNull();
    });

    it('should clear cache properly', async () => {
      await getCityDivisions('paris');
      await getCityDivisions('london');
      
      clearCache();
      
      expect(getCachedDivisions('paris')).toBeNull();
      expect(getCachedDivisions('london')).toBeNull();
    });
  });

  describe('loadCityDivisions for viewport', () => {
    it('should load divisions for cities in viewport', async () => {
      const viewport = {
        bounds: {
          west: 2.2,
          east: 2.5,
          south: 48.8,
          north: 48.9
        },
        zoom: 11
      };

      const loaded = await loadCityDivisions(viewport);
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0].cityId).toBe('paris');
    });

    it('should not load divisions when zoom is too low', async () => {
      const viewport = {
        bounds: {
          west: 2.2,
          east: 2.5,
          south: 48.8,
          north: 48.9
        },
        zoom: 9 // Below threshold
      };

      const loaded = await loadCityDivisions(viewport);
      expect(loaded).toHaveLength(0);
    });

    it('should load multiple cities in viewport', async () => {
      const viewport = {
        bounds: {
          west: -74.5,
          east: 139.8,
          south: 35.5,
          north: 49.0
        },
        zoom: 10
      };

      const loaded = await loadCityDivisions(viewport);
      
      // Should include NYC and Tokyo
      const cityIds = loaded.map(d => d.cityId);
      expect(cityIds).toContain('new-york');
      expect(cityIds).toContain('tokyo');
    });

    it('should use cached data when available', async () => {
      // Pre-cache Paris
      await getCityDivisions('paris');
      
      const viewport = {
        bounds: {
          west: 2.2,
          east: 2.5,
          south: 48.8,
          north: 48.9
        },
        zoom: 11
      };

      const loaded = await loadCityDivisions(viewport);
      expect(loaded).toHaveLength(1);
      
      // Verify it's the same cached instance
      const cached = getCachedDivisions('paris');
      expect(loaded[0]).toBe(cached);
    });
  });

  describe('data structure validation', () => {
    it('should have valid structure for all divisions', async () => {
      for (const cityId of SUPPORTED_CITIES) {
        const divisions = await getCityDivisions(cityId);
        
        expect(divisions).toBeDefined();
        expect(divisions?.cityId).toBe(cityId);
        expect(divisions?.cityName).toBeTruthy();
        expect(Array.isArray(divisions?.divisions)).toBe(true);
        expect(divisions?.divisions.length).toBeGreaterThan(0);
        
        divisions?.divisions.forEach(division => {
          expect(division.id).toMatch(new RegExp(`^${cityId}-`));
          expect(division.name).toBeTruthy();
          expect(division.coordinates).toBeDefined();
          expect(Array.isArray(division.coordinates)).toBe(true);
          expect(division.metadata).toBeDefined();
          expect(typeof division.metadata.population).toBe('number');
          expect(typeof division.metadata.area).toBe('number');
        });
      }
    });
  });
});