import { TILE_PROVIDERS, getDefaultProvider, TileProvider } from '../tileProviders';

describe('tileProviders', () => {
  describe('TILE_PROVIDERS', () => {
    it('should have openstreetmap provider', () => {
      expect(TILE_PROVIDERS.openstreetmap).toBeDefined();
      expect(TILE_PROVIDERS.openstreetmap.name).toBe('OpenStreetMap');
      expect(TILE_PROVIDERS.openstreetmap.url).toContain('tile.openstreetmap.org');
      expect(TILE_PROVIDERS.openstreetmap.attribution).toContain('OpenStreetMap');
      expect(TILE_PROVIDERS.openstreetmap.maxZoom).toBe(19);
      expect(TILE_PROVIDERS.openstreetmap.subdomains).toEqual(['a', 'b', 'c']);
    });

    it('should have cartoDB provider', () => {
      expect(TILE_PROVIDERS.cartoDB).toBeDefined();
      expect(TILE_PROVIDERS.cartoDB.name).toBe('CartoDB Positron');
      expect(TILE_PROVIDERS.cartoDB.url).toContain('basemaps.cartocdn.com/light_all');
      expect(TILE_PROVIDERS.cartoDB.attribution).toContain('CARTO');
      expect(TILE_PROVIDERS.cartoDB.maxZoom).toBe(20);
      expect(TILE_PROVIDERS.cartoDB.detectRetina).toBe(true);
    });

    it('should have cartoDBDark provider', () => {
      expect(TILE_PROVIDERS.cartoDBDark).toBeDefined();
      expect(TILE_PROVIDERS.cartoDBDark.name).toBe('CartoDB Dark Matter');
      expect(TILE_PROVIDERS.cartoDBDark.url).toContain('basemaps.cartocdn.com/dark_all');
      expect(TILE_PROVIDERS.cartoDBDark.maxZoom).toBe(20);
      expect(TILE_PROVIDERS.cartoDBDark.detectRetina).toBe(true);
    });

    it('should have stamen provider', () => {
      expect(TILE_PROVIDERS.stamen).toBeDefined();
      expect(TILE_PROVIDERS.stamen.name).toBe('Stamen Toner');
      expect(TILE_PROVIDERS.stamen.url).toContain('stamen-tiles');
      expect(TILE_PROVIDERS.stamen.attribution).toContain('Stamen Design');
    });

    it('should have custom provider template', () => {
      expect(TILE_PROVIDERS.custom).toBeDefined();
      expect(TILE_PROVIDERS.custom.name).toBe('Custom');
      expect(TILE_PROVIDERS.custom.url).toBe('');
      expect(TILE_PROVIDERS.custom.attribution).toBe('');
      expect(TILE_PROVIDERS.custom.maxZoom).toBe(18);
    });
  });

  describe('getDefaultProvider', () => {
    it('should return cartoDB for light theme', () => {
      const provider = getDefaultProvider('light');
      expect(provider).toBe(TILE_PROVIDERS.cartoDB);
    });

    it('should return cartoDBDark for dark theme', () => {
      const provider = getDefaultProvider('dark');
      expect(provider).toBe(TILE_PROVIDERS.cartoDBDark);
    });
  });

  describe('TileProvider interface', () => {
    it('should have all required properties', () => {
      const provider: TileProvider = {
        name: 'Test Provider',
        url: 'https://test.com/{z}/{x}/{y}.png',
        attribution: 'Test',
        maxZoom: 18
      };

      expect(provider.name).toBeDefined();
      expect(provider.url).toBeDefined();
      expect(provider.attribution).toBeDefined();
      expect(provider.maxZoom).toBeDefined();
    });

    it('should support optional properties', () => {
      const provider: TileProvider = {
        name: 'Test Provider',
        url: 'https://test.com/{z}/{x}/{y}.png',
        attribution: 'Test',
        maxZoom: 18,
        subdomains: ['a', 'b'],
        detectRetina: true
      };

      expect(provider.subdomains).toEqual(['a', 'b']);
      expect(provider.detectRetina).toBe(true);
    });
  });
});