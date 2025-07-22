import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../index';
import type { SearchInputProps } from '../types';

// These are integration tests that test the actual Nominatim API integration
// They should be run separately from unit tests as they make real API calls

describe('SearchInput - Nominatim Integration', () => {
  const mockOnLocationSelect = jest.fn();
  
  const defaultProps: SearchInputProps = {
    onLocationSelect: mockOnLocationSelect,
    placeholder: 'Search for a city or postal code...',
    debounceMs: 300,
    maxResults: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Real API Integration', () => {
    // Skip these tests in CI environment
    const skipInCI = process.env.CI ? it.skip : it;

    skipInCI('should fetch real results from Nominatim API', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris, France');
      
      await waitFor(() => {
        // Should find Paris, France in results
        expect(screen.getByText(/Paris.*France/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    skipInCI('should handle different languages', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      
      // Test with Japanese city name
      await user.type(input, '東京');
      
      await waitFor(() => {
        expect(screen.getByText(/Tokyo|東京/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    skipInCI('should find locations by postal code', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      
      // Test with US postal code
      await user.type(input, '10001');
      
      await waitFor(() => {
        expect(screen.getByText(/10001.*New York/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    skipInCI('should respect rate limiting', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} debounceMs={100} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      
      // Make first request
      await user.type(input, 'London');
      
      await waitFor(() => {
        expect(screen.getByText(/London/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Clear and make second request immediately
      await user.clear(input);
      await user.type(input, 'Berlin');
      
      // Should show rate limit message
      await waitFor(() => {
        expect(screen.getByText(/Please wait before searching again/i)).toBeInTheDocument();
      });
      
      // After waiting, should allow search
      await waitFor(() => {
        expect(screen.getByText(/Berlin/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to simulate network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Test City');
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to search service/i)).toBeInTheDocument();
      });
    });

    it('should handle API rate limit errors', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to simulate rate limit error
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Test City');
      
      await waitFor(() => {
        expect(screen.getByText(/Please wait before searching again/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid API responses', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to return invalid JSON
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Test City');
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to search service/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Request Validation', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should send correct headers with API requests', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'User-Agent': 'LeafletZoneSelector/1.0'
            })
          })
        );
      });
    });

    it('should include correct query parameters', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const url = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(url).toContain('q=Paris');
        expect(url).toContain('format=json');
        expect(url).toContain('addressdetails=1');
        expect(url).toContain('limit=5');
        expect(url).toContain('accept-language=');
      });
    });

    it('should respect maxResults prop in API query', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      render(<SearchInput {...defaultProps} maxResults={10} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const url = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(url).toContain('limit=10');
      });
    });
  });

  describe('Result Processing', () => {
    it('should correctly transform Nominatim results', async () => {
      const user = userEvent.setup();
      const nominatimResponse = [
        {
          place_id: 123456,
          osm_type: 'relation',
          osm_id: 71525,
          display_name: 'Paris, Île-de-France, Metropolitan France, France',
          lat: '48.8588897',
          lon: '2.3200410217200766',
          boundingbox: ['48.815573', '48.902145', '2.224199', '2.469920'],
          type: 'city',
          importance: 0.9654
        }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => nominatimResponse
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, Metropolitan France, France')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Paris, Île-de-France, Metropolitan France, France'));
      
      expect(mockOnLocationSelect).toHaveBeenCalledWith(nominatimResponse[0]);
    });

    it('should handle results with missing fields', async () => {
      const user = userEvent.setup();
      const incompleteResult = [
        {
          place_id: 123,
          display_name: 'Unknown Location',
          lat: '0',
          lon: '0',
          // Missing other fields
        }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResult
      });
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Unknown');
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Location')).toBeInTheDocument();
      });
    });
  });

  describe('Attribution Requirements', () => {
    it('should display OpenStreetMap attribution', () => {
      render(<SearchInput {...defaultProps} />);
      
      // Check for attribution text or link
      expect(screen.getByText(/OpenStreetMap/i, { selector: 'small,span,a' })).toBeInTheDocument();
    });

    it('should include attribution link', () => {
      render(<SearchInput {...defaultProps} />);
      
      const attributionLink = screen.getByRole('link', { name: /OpenStreetMap/i });
      expect(attributionLink).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
      expect(attributionLink).toHaveAttribute('target', '_blank');
      expect(attributionLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});