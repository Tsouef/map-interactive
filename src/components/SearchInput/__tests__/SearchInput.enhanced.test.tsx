import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../index';
import type { SearchInputProps, SearchResult, GeocodingService } from '../types';

// Mock geocoding service
class MockGeocodingService implements GeocodingService {
  search = jest.fn();
  reverse = jest.fn();
}

describe('SearchInput Enhanced Features', () => {
  const mockOnLocationFound = jest.fn();
  const mockOnSearchStart = jest.fn();
  const mockOnSearchEnd = jest.fn();
  const mockOnError = jest.fn();
  const mockGeocoder = new MockGeocodingService();

  const defaultProps: SearchInputProps = {
    onLocationFound: mockOnLocationFound,
    onSearchStart: mockOnSearchStart,
    onSearchEnd: mockOnSearchEnd,
    onError: mockOnError,
    geocoder: mockGeocoder,
    enableHistory: true,
    maxSuggestions: 5,
    debounceMs: 300
  };

  const mockSearchResults: SearchResult[] = [
    {
      displayName: 'Paris, Île-de-France, France',
      center: [2.3522, 48.8566],
      bounds: [2.224199, 48.815573, 2.469920, 48.902145],
      address: {
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France'
      },
      type: 'city'
    },
    {
      displayName: '10001, New York, NY, USA',
      center: [-73.9971, 40.7506],
      bounds: [-74.00, 40.74, -73.99, 40.76],
      address: {
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      type: 'postalcode'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Enhanced Props Interface', () => {
    it('should use custom geocoding service', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(mockGeocoder.search).toHaveBeenCalledWith('Paris', expect.objectContaining({
          limit: 5,
          signal: expect.any(AbortSignal)
        }));
      });
    });

    it('should respect boundingBox restriction', async () => {
      const user = userEvent.setup();
      const boundingBox: [number, number, number, number] = [2.0, 48.0, 3.0, 49.0];
      mockGeocoder.search.mockResolvedValueOnce([]);

      render(<SearchInput {...defaultProps} boundingBox={boundingBox} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(mockGeocoder.search).toHaveBeenCalledWith('Paris', expect.objectContaining({
          boundingBox: boundingBox
        }));
      });
    });

    it('should respect countryCodes restriction', async () => {
      const user = userEvent.setup();
      const countryCodes = ['FR', 'DE'];
      mockGeocoder.search.mockResolvedValueOnce([]);

      render(<SearchInput {...defaultProps} countryCodes={countryCodes} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(mockGeocoder.search).toHaveBeenCalledWith('Paris', expect.objectContaining({
          countryCodes: countryCodes
        }));
      });
    });

    it('should position search box according to position prop', () => {
      const positions: Array<'topright' | 'topleft' | 'bottomright' | 'bottomleft'> = 
        ['topright', 'topleft', 'bottomright', 'bottomleft'];
      
      positions.forEach(position => {
        const { container, unmount } = render(<SearchInput {...defaultProps} position={position} />);
        const searchControl = container.querySelector('.leaflet-search-control');
        expect(searchControl).toHaveClass(`leaflet-search-${position}`);
        unmount();
      });
    });
  });

  describe('SearchDropdown Component', () => {
    it('should render SearchDropdown with suggestions', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).toHaveClass('leaflet-search-dropdown');
        
        const suggestions = screen.getAllByRole('option');
        expect(suggestions).toHaveLength(2);
      });
    });

    it('should highlight matching text in suggestions', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const highlight = screen.getByText((content, element) => {
          return element?.tagName === 'MARK' && content === 'Paris';
        });
        expect(highlight).toBeInTheDocument();
      });
    });

    it('should show address details in suggestions', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France')).toBeInTheDocument();
        expect(screen.getByText('New York, NY, 10001')).toBeInTheDocument();
      });
    });

    it('should show location icon for regular results and history icon for recent searches', async () => {
      const user = userEvent.setup();
      const recentSearches = [{
        displayName: 'London, UK',
        center: [-0.1278, 51.5074],
        type: 'city' as const
      }];
      
      localStorage.setItem('leaflet-zone-selector-recent-searches', JSON.stringify(recentSearches));
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument();
        // Check for history icon (would need actual icon component)
        const historyIcon = screen.getByLabelText('Recent search');
        expect(historyIcon).toBeInTheDocument();
      });
    });
  });

  describe('Custom Hooks Integration', () => {
    it('should use useDebounce hook for search queries', async () => {
      const user = userEvent.setup({ delay: 50 });
      mockGeocoder.search.mockResolvedValue([]);

      render(<SearchInput {...defaultProps} debounceMs={300} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Par');
      
      // Should not call geocoder immediately
      expect(mockGeocoder.search).not.toHaveBeenCalled();
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockGeocoder.search).toHaveBeenCalledTimes(1);
      }, { timeout: 400 });
    });

    it('should use useClickOutside to close dropdown', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(
        <div>
          <SearchInput {...defaultProps} />
          <button>Outside button</button>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Click outside
      await user.click(screen.getByText('Outside button'));
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should use useLocalStorage for recent searches with maxItems limit', async () => {
      const user = userEvent.setup();
      
      // Create different search results for each iteration
      const differentResults = Array.from({ length: 12 }, (_, i) => [{
        displayName: `City ${i}, Country ${i}`,
        center: [i, i],
        type: 'city' as const,
        address: {
          city: `City ${i}`,
          country: `Country ${i}`
        }
      }]);

      render(<SearchInput {...defaultProps} enableHistory={true} />);
      
      // Select multiple different locations to test limit
      for (let i = 0; i < 12; i++) {
        mockGeocoder.search.mockResolvedValueOnce(differentResults[i]);
        
        const input = screen.getByRole('combobox');
        await user.clear(input);
        await user.type(input, `City ${i}`);
        
        await waitFor(() => {
          const suggestions = screen.getAllByRole('option');
          expect(suggestions.length).toBeGreaterThan(0);
        });
        
        const firstOption = screen.getAllByRole('option')[0];
        await user.click(firstOption);
      }
      
      // Check localStorage has max 10 items
      const stored = JSON.parse(localStorage.getItem('leaflet-zone-selector-recent-searches') || '[]');
      expect(stored).toHaveLength(10);
      // Most recent items should be at the beginning
      expect(stored[0].displayName).toBe('City 11, Country 11');
      expect(stored[9].displayName).toBe('City 2, Country 2');
    });
  });

  describe('Callbacks', () => {
    it('should call onLocationFound with SearchResult format', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions.length).toBeGreaterThan(0);
      });
      
      const firstOption = screen.getAllByRole('option')[0];
      await user.click(firstOption);
      
      expect(mockOnLocationFound).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should call onSearchStart and onSearchEnd', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 100))
      );

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(mockOnSearchStart).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockOnSearchEnd).toHaveBeenCalled();
      });
    });

    it('should call onError with proper error object', async () => {
      const user = userEvent.setup();
      const error = new Error('Geocoding service unavailable');
      error.name = 'NetworkError'; // Ensure it's not AbortError
      mockGeocoder.search.mockRejectedValueOnce(error);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Styling', () => {
    it('should apply custom class names', () => {
      render(
        <SearchInput 
          {...defaultProps}
          className="custom-search"
          inputClassName="custom-input"
          dropdownClassName="custom-dropdown"
        />
      );
      
      const container = screen.getByRole('combobox').closest('.leaflet-search-control');
      expect(container).toHaveClass('custom-search');
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('leaflet-search-input', 'custom-input');
    });

    it('should render spinner icon during loading', async () => {
      const user = userEvent.setup();
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve;
      });
      
      mockGeocoder.search.mockReturnValueOnce(searchPromise);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockGeocoder.search).toHaveBeenCalled();
      });
      
      // Check spinner is shown while loading
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('leaflet-search-spinner');
      
      // Resolve the search
      resolveSearch!(mockSearchResults);
      
      // Wait for spinner to disappear
      await waitFor(() => {
        expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
      });
    });

    it('should render clear icon button', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveClass('leaflet-search-clear');
      
      // Clear button should contain ClearIcon
      const clearIcon = clearButton.querySelector('.clear-icon');
      expect(clearIcon).toBeInTheDocument();
    });
  });

  describe('Mobile Support', () => {
    it('should have mobile-friendly touch targets', () => {
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      
      // Check that input has min-height class
      expect(input).toHaveClass('leaflet-search-input');
      // The CSS sets min-height: 44px on this class
    });

    it('should handle touch events on suggestions', async () => {
      const user = userEvent.setup();
      mockGeocoder.search.mockResolvedValueOnce(mockSearchResults);

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions).toHaveLength(2);
        
        // Check that suggestions have touch-friendly class
        suggestions.forEach(suggestion => {
          expect(suggestion).toHaveClass('leaflet-search-suggestion');
          // The CSS sets min-height: 44px on this class
        });
      });
    });
  });
});