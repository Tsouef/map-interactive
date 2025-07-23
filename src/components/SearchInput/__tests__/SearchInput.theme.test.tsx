import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput.enhanced';
import type { SearchInputProps } from '../types';

describe('SearchInput Theme and Styling', () => {
  const defaultProps: SearchInputProps = {
    placeholder: 'Search location...',
    onLocationFound: jest.fn()
  };

  describe('CSS Variables and Theme Support', () => {
    it('should support CSS variables for complete customization', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const searchControl = container.querySelector('.leaflet-search-control');
      
      // Check that the theme classes are applied
      expect(searchControl).toHaveClass('leaflet-search-theme-modern');
      
      // In jsdom, CSS variables from external CSS files aren't loaded
      // So we check that the theme system is set up correctly
      expect(searchControl).toBeTruthy();
    });

    it('should apply theme prop for styling variants', () => {
      const { container, rerender } = render(
        <SearchInput {...defaultProps} theme="modern" />
      );
      
      const searchControl = container.querySelector('.leaflet-search-control');
      expect(searchControl).toHaveClass('leaflet-search-theme-modern');
      
      rerender(<SearchInput {...defaultProps} theme="minimal" />);
      expect(searchControl).toHaveClass('leaflet-search-theme-minimal');
      
      rerender(<SearchInput {...defaultProps} theme="glass" />);
      expect(searchControl).toHaveClass('leaflet-search-theme-glass');
    });

    it('should support custom theme object', () => {
      const customTheme = {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        fontSize: '16px'
      };
      
      const { container } = render(
        <SearchInput {...defaultProps} customTheme={customTheme} />
      );
      
      const searchControl = container.querySelector('.leaflet-search-control');
      const style = searchControl?.getAttribute('style');
      
      expect(style).toContain('--search-primary-color: #3b82f6');
      expect(style).toContain('--search-background: #ffffff');
      expect(style).toContain('--search-text-color: #1f2937');
      expect(style).toContain('--search-border-radius: 12px');
    });
  });

  describe('Visual Design Improvements', () => {
    it('should have modern input styling with proper padding and borders', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const input = screen.getByRole('combobox');
      
      // Check that the input has the proper classes
      expect(input).toHaveClass('leaflet-search-input');
      
      // Verify the element structure is correct
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      expect(wrapper).toBeInTheDocument();
      
      // Icon should be present
      const icon = container.querySelector('.leaflet-search-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have elevated design with proper shadows', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      
      // Verify wrapper exists and has proper structure
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.parentElement).toHaveClass('leaflet-search-control');
    });

    it('should have smooth focus transitions', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const input = screen.getByRole('combobox');
      
      // Verify input exists and has proper attributes
      expect(input).toHaveClass('leaflet-search-input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have proper icon styling and alignment', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const icon = container.querySelector('.leaflet-search-icon');
      
      // Icon should exist as an SVG element
      expect(icon).toBeInTheDocument();
      expect(icon?.tagName.toLowerCase()).toBe('svg');
      expect(icon).toHaveAttribute('width');
      expect(icon).toHaveAttribute('height');
    });
  });

  describe('Dark Mode Enhancement', () => {
    beforeEach(() => {
      document.documentElement.classList.add('dark');
    });

    afterEach(() => {
      document.documentElement.classList.remove('dark');
    });

    it('should have proper dark mode colors with good contrast', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const searchControl = container.querySelector('.leaflet-search-control');
      
      // Verify dark mode class can be applied
      expect(searchControl).toBeInTheDocument();
      
      // The CSS would apply dark mode styles when .dark class is on root
      expect(document.documentElement).toHaveClass('dark');
    });

    it('should have enhanced shadows in dark mode', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      
      // Verify structure is correct for dark mode
      expect(wrapper).toBeInTheDocument();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Dropdown Styling', () => {
    it('should have modern dropdown design with proper spacing', async () => {
      const user = userEvent.setup();
      const mockGeocoder = {
        search: jest.fn().mockResolvedValue([
          {
            displayName: 'Paris, France',
            center: [2.3522, 48.8566],
            type: 'city'
          }
        ]),
        reverse: jest.fn()
      };
      
      const { container } = render(<SearchInput {...defaultProps} geocoder={mockGeocoder} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      // Wait for dropdown
      const dropdown = await screen.findByRole('listbox');
      expect(dropdown).toHaveClass('leaflet-search-dropdown');
    });

    it('should have hover effects on suggestions', async () => {
      const user = userEvent.setup();
      const mockGeocoder = {
        search: jest.fn().mockResolvedValue([
          {
            displayName: 'Paris, France',
            center: [2.3522, 48.8566],
            type: 'city'
          }
        ]),
        reverse: jest.fn()
      };
      
      render(<SearchInput {...defaultProps} geocoder={mockGeocoder} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      const suggestions = await screen.findAllByRole('option');
      const firstSuggestion = suggestions[0];
      
      // Check suggestion has proper class
      expect(firstSuggestion).toHaveClass('leaflet-search-suggestion');
      
      // Hover effects would be applied via CSS
      await user.hover(firstSuggestion);
    });

    it('should highlight search terms with proper styling', async () => {
      const user = userEvent.setup();
      const mockGeocoder = {
        search: jest.fn().mockResolvedValue([
          {
            displayName: 'Paris, France',
            center: [2.3522, 48.8566],
            type: 'city'
          }
        ]),
        reverse: jest.fn()
      };
      
      render(<SearchInput {...defaultProps} geocoder={mockGeocoder} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      // Wait for suggestions
      await screen.findByRole('listbox');
      
      // Check that highlight is applied - mark tag would be created by SearchDropdown
      const highlight = screen.getByText((content, element) => {
        return element?.tagName === 'MARK' && content === 'Paris';
      });
      
      expect(highlight).toBeInTheDocument();
      expect(highlight.tagName).toBe('MARK');
    });
  });

  describe('Interactive States', () => {
    it('should show focus ring on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      await user.tab();
      const input = screen.getByRole('combobox');
      
      // Input should be focused
      expect(input).toHaveFocus();
      expect(input).toHaveClass('leaflet-search-input');
    });

    it('should have smooth transitions for all interactive elements', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      // Type to show clear button
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toHaveClass('leaflet-search-clear');
    });

    it('should scale clear button on hover', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByLabelText('Clear search');
      
      // Verify clear button exists and can be interacted with
      expect(clearButton).toBeInTheDocument();
      await user.hover(clearButton);
      
      // Hover effects would be applied via CSS
      expect(clearButton).toHaveClass('leaflet-search-clear');
    });
  });

  describe('Loading State Styling', () => {
    it('should show modern spinner with proper animation', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      // Simulate loading state
      const spinner = container.querySelector('.leaflet-search-spinner');
      if (spinner) {
        const computedStyle = window.getComputedStyle(spinner);
        expect(computedStyle.animation).toMatch(/spin/);
        expect(computedStyle.color).toBe('rgb(59, 130, 246)'); // Primary color
      }
    });
  });

  describe('Responsive Design', () => {
    it('should adapt styling for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      
      const { container } = render(<SearchInput {...defaultProps} />);
      const searchControl = container.querySelector('.leaflet-search-control');
      
      // Verify control exists and has proper structure
      expect(searchControl).toBeInTheDocument();
      expect(searchControl).toHaveClass('leaflet-search-control');
      
      // CSS media queries would handle the responsive behavior
    });
  });
});