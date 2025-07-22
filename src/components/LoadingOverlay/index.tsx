interface LoadingOverlayProps {
  message?: string;
}

// Mock implementation for testing
export const LoadingOverlay = ({ message = 'Loading...' }: LoadingOverlayProps) => {
  return (
    <div className="loading-overlay">
      <div>{message}</div>
    </div>
  );
};