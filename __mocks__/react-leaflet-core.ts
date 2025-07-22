/* eslint-disable @typescript-eslint/no-explicit-any */
export const createControlComponent = (createInstance: any) => {
  return (props: any) => {
    const instance = createInstance(props);
    return instance;
  };
};

export const createLayerComponent = (createInstance: any, updateInstance?: any) => {
  return (props: any) => {
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

export const LeafletProvider = ({ children }: any) => children;
export const LeafletConsumer = ({ children }: any) => children;