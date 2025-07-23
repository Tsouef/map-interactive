import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchDropdown } from '../SearchDropdown';
import type { SearchResult } from '../types';

describe('SearchDropdown', () => {
  const mockOnSelect = jest.fn();
  const mockOnHover = jest.fn();

  const mockSuggestions: SearchResult[] = [
    {
      displayName: 'Paris, Île-de-France, France',
      center: [2.3522, 48.8566],
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
  });

  describe('Basic Rendering', () => {
    it('should render dropdown with suggestions', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveClass('leaflet-search-dropdown');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    it('should show location icons for regular suggestions', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const locationIcons = screen.getAllByLabelText('Location');
      expect(locationIcons).toHaveLength(2);
    });

    it('should show history header and icons for recent searches', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
          isHistory={true}
        />
      );

      expect(screen.getByText('Recent searches')).toBeInTheDocument();
      
      const historyIcons = screen.getAllByLabelText('Recent search');
      expect(historyIcons).toHaveLength(2);
    });

    it('should apply custom className', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
          className="custom-dropdown"
        />
      );

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveClass('leaflet-search-dropdown', 'custom-dropdown');
    });
  });

  describe('Suggestion Display', () => {
    it('should display suggestion names', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      expect(screen.getByText('10001, New York, NY, USA')).toBeInTheDocument();
    });

    it('should display formatted addresses', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      expect(screen.getByText('Paris, Île-de-France')).toBeInTheDocument();
      expect(screen.getByText('New York, NY, 10001')).toBeInTheDocument();
    });

    it('should highlight matching text in suggestions', () => {
      // Pass query through a prop or context
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
          query="Paris"
        />
      );

      const highlight = screen.getByText((content, element) => {
        return element?.tagName === 'MARK' && content === 'Paris';
      });
      expect(highlight).toBeInTheDocument();
    });

    it('should not highlight text for history items', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
          isHistory={true}
          query="Paris"
        />
      );

      const marks = screen.queryAllByText((content, element) => element?.tagName === 'MARK');
      expect(marks).toHaveLength(0);
    });
  });

  describe('Selection Behavior', () => {
    it('should highlight selected item', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[0]).not.toHaveClass('selected');
      
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveClass('selected');
    });

    it('should call onSelect when suggestion is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      await user.click(screen.getByText('Paris, Île-de-France, France'));
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should call onHover when mouse enters suggestion', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const firstSuggestion = screen.getByText('Paris, Île-de-France, France').closest('[role="option"]');
      await user.hover(firstSuggestion!);
      
      expect(mockOnHover).toHaveBeenCalledWith(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('id', 'search-suggestions');

      const options = screen.getAllByRole('option');
      options.forEach((option, index) => {
        expect(option).toHaveAttribute('aria-selected', String(index === 1));
      });
    });

    it('should have unique keys for each suggestion', () => {
      const { container } = render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const options = container.querySelectorAll('[role="option"]');
      const keys = Array.from(options).map(opt => opt.getAttribute('data-key'));
      const uniqueKeys = new Set(keys);
      
      expect(uniqueKeys.size).toBe(options.length);
    });
  });

  describe('Empty States', () => {
    it('should render empty dropdown when no suggestions', () => {
      render(
        <SearchDropdown
          suggestions={[]}
          selectedIndex={-1}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toBeInTheDocument();
      
      const options = screen.queryAllByRole('option');
      expect(options).toHaveLength(0);
    });
  });

  describe('Styling', () => {
    it('should have proper CSS classes for styling', () => {
      const { container } = render(
        <SearchDropdown
          suggestions={mockSuggestions}
          selectedIndex={0}
          onSelect={mockOnSelect}
          onHover={mockOnHover}
        />
      );

      // Check dropdown classes
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveClass('leaflet-search-dropdown');

      // Check suggestion classes
      const suggestions = screen.getAllByRole('option');
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveClass('leaflet-search-suggestion');
      });

      // Check selected class
      expect(suggestions[0]).toHaveClass('selected');

      // Check icon wrapper
      const iconWrappers = container.querySelectorAll('.leaflet-search-suggestion-icon');
      expect(iconWrappers.length).toBeGreaterThan(0);

      // Check content wrapper
      const contentWrappers = container.querySelectorAll('.leaflet-search-suggestion-content');
      expect(contentWrappers.length).toBeGreaterThan(0);
    });
  });
});