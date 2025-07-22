import type { Zone } from '@/types';

// Real-like OSM data for testing
export const PARIS_DISTRICTS: Record<string, Zone> = {
  'paris-1': {
    id: 'paris-1',
    name: '1er Arrondissement',
    coordinates: [[
      [2.3301, 48.8600],
      [2.3301, 48.8700],
      [2.3500, 48.8700],
      [2.3500, 48.8600],
      [2.3301, 48.8600] // Closing the polygon
    ]],
    properties: {
      postalCode: '75001',
      population: 16266
    }
  },
  'paris-2': {
    id: 'paris-2',
    name: '2e Arrondissement',
    coordinates: [[
      [2.3500, 48.8600], // Adjacent to 1st
      [2.3500, 48.8700],
      [2.3700, 48.8700],
      [2.3700, 48.8600],
      [2.3500, 48.8600]
    ]],
    properties: {
      postalCode: '75002',
      population: 20900
    }
  },
  'paris-3': {
    id: 'paris-3',
    name: '3e Arrondissement',
    coordinates: [[
      [2.3500, 48.8600], // Adjacent to 2nd
      [2.3500, 48.8650],
      [2.3650, 48.8650],
      [2.3650, 48.8600],
      [2.3500, 48.8600]
    ]],
    properties: {
      postalCode: '75003',
      population: 34389
    }
  },
  'paris-16': {
    id: 'paris-16',
    name: '16e Arrondissement',
    coordinates: [[
      [2.2250, 48.8500], // Far from central Paris
      [2.2250, 48.8700],
      [2.2800, 48.8700],
      [2.2800, 48.8500],
      [2.2250, 48.8500]
    ]],
    properties: {
      postalCode: '75016',
      population: 165446
    }
  },
  'paris-17': {
    id: 'paris-17',
    name: '17e Arrondissement',
    coordinates: [[
      [2.2800, 48.8700], // Adjacent to 16th
      [2.2800, 48.8900],
      [2.3200, 48.8900],
      [2.3200, 48.8700],
      [2.2800, 48.8700]
    ]],
    properties: {
      postalCode: '75017',
      population: 168454
    }
  }
};

export const LONDON_BOROUGHS: Record<string, Zone> = {
  'westminster': {
    id: 'westminster',
    name: 'City of Westminster',
    coordinates: [[
      [-0.1870, 51.4975],
      [-0.1870, 51.5300],
      [-0.1130, 51.5300],
      [-0.1130, 51.4975],
      [-0.1870, 51.4975]
    ]],
    properties: {
      postalCode: 'SW1',
      population: 255324
    }
  },
  'camden': {
    id: 'camden',
    name: 'Camden',
    coordinates: [[
      [-0.1870, 51.5300], // Adjacent to Westminster
      [-0.1870, 51.5600],
      [-0.1130, 51.5600],
      [-0.1130, 51.5300],
      [-0.1870, 51.5300]
    ]],
    properties: {
      postalCode: 'NW1',
      population: 270029
    }
  }
};

export const NYC_BOROUGHS: Record<string, Zone> = {
  'manhattan': {
    id: 'manhattan',
    name: 'Manhattan',
    coordinates: [[
      [-74.0194, 40.7000],
      [-74.0194, 40.7900],
      [-73.9070, 40.7900],
      [-73.9070, 40.7000],
      [-74.0194, 40.7000]
    ]],
    properties: {
      postalCode: '10001',
      population: 1628706
    }
  },
  'brooklyn': {
    id: 'brooklyn',
    name: 'Brooklyn',
    coordinates: [[
      [-74.0420, 40.5780],
      [-74.0420, 40.7390],
      [-73.8330, 40.7390],
      [-73.8330, 40.5780],
      [-74.0420, 40.5780]
    ]],
    properties: {
      postalCode: '11201',
      population: 2648771
    }
  }
};

// Mock function to get zones for a city
export function getCityZones(cityName: string): Zone[] {
  const normalizedName = cityName.toLowerCase();
  
  if (normalizedName.includes('paris')) {
    return Object.values(PARIS_DISTRICTS);
  }
  if (normalizedName.includes('london')) {
    return Object.values(LONDON_BOROUGHS);
  }
  if (normalizedName.includes('new york') || normalizedName.includes('nyc')) {
    return Object.values(NYC_BOROUGHS);
  }
  
  return [];
}

// Helper to create mock zone
export function createMockZone(id: string, coordinates?: number[][][]): Zone {
  return {
    id,
    name: `Zone ${id}`,
    coordinates: coordinates || [[
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0]
    ]],
    properties: {}
  };
}