import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../index';
import type { SearchInputProps, NominatimResult } from '../types';

// Mock fetch for Nominatim API
global.fetch = jest.fn();

describe('SearchInput', () => {
  const mockOnLocationSelect = jest.fn();
  
  const defaultProps: SearchInputProps = {
    onLocationSelect: mockOnLocationSelect,
    placeholder: 'Search for a city or postal code...',
    debounceMs: 300,
    maxResults: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic Functionality', () => {
    it('should render search input with placeholder', () => {
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      expect(input).toHaveValue('Paris');
    });

    it('should show clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<SearchInput {...defaultProps} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      expect(input).toBeDisabled();
    });
  });

  describe('Autocomplete Functionality', () => {
    const mockResults: NominatimResult[] = [
      {
        place_id: 1,
        osm_type: 'relation',
        osm_id: 71525,
        display_name: 'Paris, Île-de-France, France',
        lat: '48.8566',
        lon: '2.3522',
        boundingbox: ['48.815573', '48.902145', '2.224199', '2.469920'],
        type: 'city',
        importance: 0.9
      },
      {
        place_id: 2,
        osm_type: 'node',
        osm_id: 12345,
        display_name: 'Paris, Texas, USA',
        lat: '33.6609',
        lon: '-95.5555',
        boundingbox: ['33.6', '33.7', '-95.6', '-95.5'],
        type: 'city',
        importance: 0.7
      }
    ];

    it('should display autocomplete results after typing', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
        expect(screen.getByText('Paris, Texas, USA')).toBeInTheDocument();
      });
    });

    it('should debounce API calls', async () => {
      const user = userEvent.setup({ delay: 50 });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} debounceMs={300} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Par');
      
      // Should not call API yet
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Wait for debounce
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }, { timeout: 400 });
    });

    it('should limit results to maxResults prop', async () => {
      const user = userEvent.setup();
      const manyResults = Array.from({ length: 10 }, (_, i) => ({
        ...mockResults[0],
        place_id: i,
        display_name: `Result ${i}`
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyResults
      });

      render(<SearchInput {...defaultProps} maxResults={3} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Test');
      
      await waitFor(() => {
        expect(screen.getByText('Result 0')).toBeInTheDocument();
        expect(screen.getByText('Result 1')).toBeInTheDocument();
        expect(screen.getByText('Result 2')).toBeInTheDocument();
        expect(screen.queryByText('Result 3')).not.toBeInTheDocument();
      });
    });

    it('should call onLocationSelect when result is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Paris, Île-de-France, France'));
      
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockResults[0]);
      expect(input).toHaveValue('');
      expect(screen.queryByText('Paris, Île-de-France, France')).not.toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching results', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => []
        }), 1000))
      );

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });

    it('should show error message when API fails', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect to search service/i)).toBeInTheDocument();
      });
    });

    it('should show no results message when no locations found', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'NonexistentCity123');
      
      await waitFor(() => {
        expect(screen.getByText(/no locations found/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum query length', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Pa');
      
      await waitFor(() => {
        expect(screen.getByText(/please enter at least 3 characters/i)).toBeInTheDocument();
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate results with arrow keys', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      // Press arrow down
      await user.keyboard('{ArrowDown}');
      
      const firstResult = screen.getByText('Paris, Île-de-France, France').closest('li');
      expect(firstResult).toHaveAttribute('aria-selected', 'true');
      
      // Press arrow down again
      await user.keyboard('{ArrowDown}');
      
      const secondResult = screen.getByText('Paris, Texas, USA').closest('li');
      expect(secondResult).toHaveAttribute('aria-selected', 'true');
      expect(firstResult).toHaveAttribute('aria-selected', 'false');
    });

    it('should select result with Enter key', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}{Enter}');
      
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    it('should close results with Escape key', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByText('Paris, Île-de-France, France')).not.toBeInTheDocument();
      expect(input).toHaveValue('Paris'); // Input value should remain
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-controls', listbox.id);
      });
    });

    it('should announce results to screen readers', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        const announcement = screen.getByRole('status', { hidden: true });
        expect(announcement).toHaveTextContent('2 results available');
      });
    });

    it('should manage focus correctly', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      // Tab should move focus to first result
      await user.tab();
      
      const firstResult = screen.getByText('Paris, Île-de-France, France').closest('li');
      expect(firstResult).toHaveFocus();
    });
  });

  describe('Postal Code Support', () => {
    it('should recognize and search for US postal codes', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          place_id: 3,
          osm_type: 'node',
          osm_id: 789,
          display_name: '10001, New York, NY, USA',
          lat: '40.7506',
          lon: '-73.9971',
          boundingbox: ['40.74', '40.76', '-74.00', '-73.99'],
          type: 'postcode',
          importance: 0.8
        }]
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, '10001');
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('q=10001'),
          expect.any(Object)
        );
        expect(screen.getByText('10001, New York, NY, USA')).toBeInTheDocument();
      });
    });

    it('should recognize and search for UK postal codes', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'SW1A 1AA');
      
      // Should not show validation error for valid UK postcode
      await waitFor(() => {
        expect(screen.queryByText(/please enter at least 3 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches', () => {
    it('should show recent searches when input is focused and empty', async () => {
      const user = userEvent.setup();
      const recentSearches = [
        { display_name: 'Paris, France', lat: '48.8566', lon: '2.3522' },
        { display_name: 'London, UK', lat: '51.5074', lon: '-0.1278' }
      ];

      // Mock localStorage
      Storage.prototype.getItem = jest.fn(() => JSON.stringify(recentSearches));

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.click(input);
      
      expect(screen.getByText('Recent searches')).toBeInTheDocument();
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
      expect(screen.getByText('London, UK')).toBeInTheDocument();
    });

    it('should save selected location to recent searches', async () => {
      const user = userEvent.setup();
      Storage.prototype.setItem = jest.fn();
      Storage.prototype.getItem = jest.fn(() => '[]');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Paris, Île-de-France, France'));
      
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'leaflet-zone-selector-recent-searches',
        expect.stringContaining('Paris, Île-de-France, France')
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should respect Nominatim rate limit of 1 request per second', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      render(<SearchInput {...defaultProps} debounceMs={100} />);
      
      const input = screen.getByPlaceholderText('Search for a city or postal code...');
      
      // Type first query
      await user.clear(input);
      await user.type(input, 'Paris');
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      // Type second query immediately
      await user.clear(input);
      await user.type(input, 'London');
      
      // Should show rate limit message
      await waitFor(() => {
        expect(screen.getByText(/please wait before searching again/i)).toBeInTheDocument();
      });
      
      // After 1 second, should allow search
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      }, { timeout: 1500 });
    });
  });
});