export const mockNominatimSearch = jest.fn().mockResolvedValue([
  {
    place_id: 207589533,
    licence: 'Data © OpenStreetMap contributors',
    osm_type: 'relation',
    osm_id: 71525,
    boundingbox: ['48.815573', '48.902145', '2.224199', '2.469920'],
    lat: '48.8566',
    lon: '2.3522',
    display_name: 'Paris, Île-de-France, Metropolitan France, France',
    class: 'boundary',
    type: 'administrative',
    importance: 0.9712299685567256,
    icon: 'https://nominatim.openstreetmap.org/ui/mapicons/poi_boundary_administrative.p.20.png',
    address: {
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      country_code: 'fr',
    },
    extratags: {
      capital: 'yes',
      website: 'https://www.paris.fr',
      wikidata: 'Q90',
      wikipedia: 'fr:Paris',
      population: '2145906',
    },
  },
]);

export const mockOverpassQuery = jest.fn().mockResolvedValue({
  elements: [
    {
      type: 'relation',
      id: 71525,
      members: [
        {
          type: 'way',
          ref: 123456,
          role: 'outer',
        },
      ],
      tags: {
        admin_level: '8',
        boundary: 'administrative',
        name: 'Paris',
        'name:en': 'Paris',
        type: 'boundary',
        wikidata: 'Q90',
        wikipedia: 'fr:Paris',
      },
    },
    {
      type: 'way',
      id: 123456,
      nodes: [1, 2, 3, 4, 5, 1], // Closed way
      tags: {},
    },
    {
      type: 'node',
      id: 1,
      lat: 48.815573,
      lon: 2.224199,
    },
    {
      type: 'node',
      id: 2,
      lat: 48.815573,
      lon: 2.469920,
    },
    {
      type: 'node',
      id: 3,
      lat: 48.902145,
      lon: 2.469920,
    },
    {
      type: 'node',
      id: 4,
      lat: 48.902145,
      lon: 2.224199,
    },
    {
      type: 'node',
      id: 5,
      lat: 48.815573,
      lon: 2.224199,
    },
  ],
});

// Mock for fetching Paris districts
export const mockParisDistrictsQuery = jest.fn().mockResolvedValue({
  elements: [
    // Paris 1st arrondissement
    {
      type: 'relation',
      id: 9521,
      tags: {
        admin_level: '9',
        boundary: 'administrative',
        name: '1er Arrondissement',
        'name:en': '1st Arrondissement',
        ref: '751101',
        type: 'boundary',
      },
      members: [
        {
          type: 'way',
          ref: 200001,
          role: 'outer',
        },
      ],
    },
    {
      type: 'way',
      id: 200001,
      nodes: [11, 12, 13, 14, 11],
    },
    {
      type: 'node',
      id: 11,
      lat: 48.860000,
      lon: 2.330000,
    },
    {
      type: 'node',
      id: 12,
      lat: 48.860000,
      lon: 2.350000,
    },
    {
      type: 'node',
      id: 13,
      lat: 48.870000,
      lon: 2.350000,
    },
    {
      type: 'node',
      id: 14,
      lat: 48.870000,
      lon: 2.330000,
    },
    // Paris 2nd arrondissement (adjacent to 1st)
    {
      type: 'relation',
      id: 9522,
      tags: {
        admin_level: '9',
        boundary: 'administrative',
        name: '2e Arrondissement',
        'name:en': '2nd Arrondissement',
        ref: '751102',
        type: 'boundary',
      },
      members: [
        {
          type: 'way',
          ref: 200002,
          role: 'outer',
        },
      ],
    },
    {
      type: 'way',
      id: 200002,
      nodes: [21, 22, 23, 24, 21],
    },
    {
      type: 'node',
      id: 21,
      lat: 48.860000,
      lon: 2.350000,
    },
    {
      type: 'node',
      id: 22,
      lat: 48.860000,
      lon: 2.370000,
    },
    {
      type: 'node',
      id: 23,
      lat: 48.870000,
      lon: 2.370000,
    },
    {
      type: 'node',
      id: 24,
      lat: 48.870000,
      lon: 2.350000,
    },
  ],
});

// Mock postal code search
export const mockPostalCodeSearch = jest.fn().mockResolvedValue([
  {
    place_id: 123456789,
    licence: 'Data © OpenStreetMap contributors',
    osm_type: 'relation',
    osm_id: 123456,
    boundingbox: ['48.850000', '48.870000', '2.330000', '2.350000'],
    lat: '48.860000',
    lon: '2.340000',
    display_name: '75001, 1er Arrondissement, Paris, Île-de-France, Metropolitan France, France',
    class: 'boundary',
    type: 'postal_code',
    importance: 0.625,
    address: {
      postcode: '75001',
      city_district: '1er Arrondissement',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      country_code: 'fr',
    },
  },
]);

// Mock function to simulate API calls
export const createOSMApiMock = () => {
  return {
    searchPlace: mockNominatimSearch,
    searchPostalCode: mockPostalCodeSearch,
    fetchBoundary: mockOverpassQuery,
    fetchDistrictBoundaries: mockParisDistrictsQuery,
  };
};

export default createOSMApiMock();