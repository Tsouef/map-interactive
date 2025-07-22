import { mockMap } from './leaflet';

export const useMap = () => mockMap;

type EventHandler = (...args: unknown[]) => void;

export const useMapEvents = (handlers: Record<string, EventHandler>) => {
  // Mock implementation - just return the mock map
  Object.keys(handlers).forEach((event) => {
    mockMap.on(event, handlers[event]);
  });
  return mockMap;
};