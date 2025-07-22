import type { Zone } from '../types';

// Demo zones for Paris arrondissements (simplified boundaries)
export const DEMO_ZONES: Zone[] = [
  {
    id: 'paris-1',
    name: 'Paris 1er',
    coordinates: [[
      [2.3322, 48.8600],
      [2.3322, 48.8700],
      [2.3422, 48.8700],
      [2.3422, 48.8600],
      [2.3322, 48.8600]
    ]],
    properties: { postalCode: '75001' }
  },
  {
    id: 'paris-2',
    name: 'Paris 2e',
    coordinates: [[
      [2.3422, 48.8650],
      [2.3422, 48.8750],
      [2.3522, 48.8750],
      [2.3522, 48.8650],
      [2.3422, 48.8650]
    ]],
    properties: { postalCode: '75002' }
  },
  {
    id: 'paris-3',
    name: 'Paris 3e',
    coordinates: [[
      [2.3522, 48.8600],
      [2.3522, 48.8700],
      [2.3622, 48.8700],
      [2.3622, 48.8600],
      [2.3522, 48.8600]
    ]],
    properties: { postalCode: '75003' }
  },
  {
    id: 'paris-4',
    name: 'Paris 4e',
    coordinates: [[
      [2.3522, 48.8500],
      [2.3522, 48.8600],
      [2.3622, 48.8600],
      [2.3622, 48.8500],
      [2.3522, 48.8500]
    ]],
    properties: { postalCode: '75004' }
  },
  {
    id: 'paris-5',
    name: 'Paris 5e',
    coordinates: [[
      [2.3422, 48.8400],
      [2.3422, 48.8500],
      [2.3522, 48.8500],
      [2.3522, 48.8400],
      [2.3422, 48.8400]
    ]],
    properties: { postalCode: '75005' }
  },
  {
    id: 'paris-6',
    name: 'Paris 6e',
    coordinates: [[
      [2.3222, 48.8450],
      [2.3222, 48.8550],
      [2.3322, 48.8550],
      [2.3322, 48.8450],
      [2.3222, 48.8450]
    ]],
    properties: { postalCode: '75006' }
  },
  {
    id: 'paris-7',
    name: 'Paris 7e',
    coordinates: [[
      [2.3022, 48.8500],
      [2.3022, 48.8600],
      [2.3122, 48.8600],
      [2.3122, 48.8500],
      [2.3022, 48.8500]
    ]],
    properties: { postalCode: '75007' }
  },
  {
    id: 'paris-8',
    name: 'Paris 8e',
    coordinates: [[
      [2.2922, 48.8700],
      [2.2922, 48.8800],
      [2.3122, 48.8800],
      [2.3122, 48.8700],
      [2.2922, 48.8700]
    ]],
    properties: { postalCode: '75008' }
  },
  {
    id: 'paris-9',
    name: 'Paris 9e',
    coordinates: [[
      [2.3322, 48.8750],
      [2.3322, 48.8850],
      [2.3422, 48.8850],
      [2.3422, 48.8750],
      [2.3322, 48.8750]
    ]],
    properties: { postalCode: '75009' }
  },
  {
    id: 'paris-10',
    name: 'Paris 10e',
    coordinates: [[
      [2.3522, 48.8750],
      [2.3522, 48.8850],
      [2.3622, 48.8850],
      [2.3622, 48.8750],
      [2.3522, 48.8750]
    ]],
    properties: { postalCode: '75010' }
  }
];

// Convert zones to GeoJSON features
export const DEMO_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: DEMO_ZONES.map(zone => ({
    type: 'Feature' as const,
    id: zone.id,
    properties: {
      id: zone.id,
      name: zone.name,
      ...zone.properties
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: zone.coordinates
    }
  }))
};