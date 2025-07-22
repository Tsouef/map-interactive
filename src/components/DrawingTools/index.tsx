interface DrawingToolsProps {
  onShapeCreated: (shape: GeoJSON.Feature) => void;
}

// Mock implementation for testing
export const DrawingTools = ({ onShapeCreated }: DrawingToolsProps) => {
  return (
    <div data-testid="drawing-tools">
      <button 
        onClick={() => {
          // Mock shape creation
          const mockShape: GeoJSON.Feature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
            },
            properties: {}
          };
          onShapeCreated(mockShape);
        }}
      >
        Draw
      </button>
    </div>
  );
};