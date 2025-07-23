import type { Zone } from '@/types';

export const parisZones: Zone[] = [
  {
    id: 'paris-1',
    name: '1er Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.3410, 48.8637],
        [2.3428, 48.8589],
        [2.3366, 48.8566],
        [2.3320, 48.8607],
        [2.3354, 48.8635],
        [2.3410, 48.8637]
      ]]
    },
    properties: {
      population: 16266,
      area: 1.83
    }
  },
  {
    id: 'paris-2',
    name: '2e Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.3428, 48.8589],
        [2.3456, 48.8644],
        [2.3502, 48.8678],
        [2.3548, 48.8636],
        [2.3485, 48.8605],
        [2.3428, 48.8589]
      ]]
    },
    properties: {
      population: 20900,
      area: 0.99
    }
  },
  {
    id: 'paris-3',
    name: '3e Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.3548, 48.8636],
        [2.3583, 48.8652],
        [2.3652, 48.8638],
        [2.3670, 48.8598],
        [2.3608, 48.8576],
        [2.3548, 48.8636]
      ]]
    },
    properties: {
      population: 34115,
      area: 1.17
    }
  },
  {
    id: 'paris-4',
    name: '4e Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.3485, 48.8605],
        [2.3548, 48.8636],
        [2.3608, 48.8576],
        [2.3622, 48.8515],
        [2.3556, 48.8499],
        [2.3485, 48.8605]
      ]]
    },
    properties: {
      population: 27769,
      area: 1.60
    }
  },
  {
    id: 'paris-5',
    name: '5e Arrondissement',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2.3366, 48.8474],
        [2.3451, 48.8438],
        [2.3556, 48.8499],
        [2.3485, 48.8605],
        [2.3366, 48.8566],
        [2.3366, 48.8474]
      ]]
    },
    properties: {
      population: 59108,
      area: 2.54
    }
  }
];