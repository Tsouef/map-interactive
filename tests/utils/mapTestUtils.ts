import { fireEvent } from '@testing-library/react';

export const simulateMapClick = (element: HTMLElement, lat: number, lng: number) => {
  fireEvent.click(element, {
    latlng: { lat, lng },
    originalEvent: { preventDefault: jest.fn() }
  });
};

export const simulateZoneHover = (element: HTMLElement, zoneId: string) => {
  fireEvent.mouseOver(element, {
    target: { feature: { properties: { id: zoneId } } }
  });
};

export const createMockGeoJSON = (id: string, coordinates: number[][][]) => ({
  type: 'Feature',
  properties: { id, name: `Zone ${id}` },
  geometry: {
    type: 'Polygon',
    coordinates
  }
});