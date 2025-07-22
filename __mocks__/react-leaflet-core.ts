import React from 'react';

type CreateInstanceFn = (props: Record<string, unknown>) => unknown;
type UpdateInstanceFn = (instance: unknown, props: Record<string, unknown>, prevProps: Record<string, unknown>) => void;

export const createControlComponent = (createInstance: CreateInstanceFn) => {
  return (props: Record<string, unknown>) => {
    const instance = createInstance(props);
    return instance;
  };
};

export const createLayerComponent = (createInstance: CreateInstanceFn, updateInstance?: UpdateInstanceFn) => {
  return (props: Record<string, unknown>) => {
    const instance = createInstance(props);
    if (updateInstance) {
      updateInstance(instance, props, {});
    }
    return instance;
  };
};

export const useLeafletContext = () => ({
  map: jest.fn(),
  layerContainer: jest.fn(),
  layersControl: jest.fn(),
  overlayContainer: jest.fn(),
  pane: 'overlayPane',
});

interface LeafletProviderProps {
  children: React.ReactNode;
}

export const LeafletProvider = ({ children }: LeafletProviderProps) => children;
export const LeafletConsumer = ({ children }: LeafletProviderProps) => children;