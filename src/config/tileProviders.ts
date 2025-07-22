export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  detectRetina?: boolean;
}

export const TILE_PROVIDERS: Record<string, TileProvider> = {
  openstreetmap: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  
  cartoDB: {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  cartoDBDark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  stamen: {
    name: 'Stamen Toner',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    detectRetina: true
  },
  
  custom: {
    name: 'Custom',
    url: '', // User-provided
    attribution: '', // User-provided
    maxZoom: 18
  }
};

export const getDefaultProvider = (theme: 'light' | 'dark'): TileProvider => {
  return theme === 'dark' ? TILE_PROVIDERS.cartoDBDark : TILE_PROVIDERS.cartoDB;
};