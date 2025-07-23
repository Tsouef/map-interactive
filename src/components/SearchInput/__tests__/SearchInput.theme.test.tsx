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
      
      const computedStyle = window.getComputedStyle(searchControl!);
      
      // Check for CSS variables
      expect(computedStyle.getPropertyValue('--search-primary-color')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--search-background')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--search-text-color')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--search-border-radius')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--search-shadow')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--search-transition')).toBeTruthy();
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
      
      const computedStyle = window.getComputedStyle(input);
      
      // Modern input styling
      expect(computedStyle.borderRadius).toBe('8px');
      expect(computedStyle.fontSize).toBe('15px');
      expect(computedStyle.paddingLeft).toBe('40px'); // Space for icon
      expect(computedStyle.paddingRight).toBe('40px'); // Space for clear button
      expect(computedStyle.height).toBe('44px'); // Proper height
    });

    it('should have elevated design with proper shadows', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      
      const computedStyle = window.getComputedStyle(wrapper!);
      expect(computedStyle.boxShadow).toMatch(/0\s+2px\s+8px.*rgba/);
    });

    it('should have smooth focus transitions', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const input = screen.getByRole('combobox');
      
      const computedStyle = window.getComputedStyle(input);
      expect(computedStyle.transition).toContain('border-color');
      expect(computedStyle.transition).toContain('box-shadow');
    });

    it('should have proper icon styling and alignment', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const icon = container.querySelector('.leaflet-search-icon');
      
      const computedStyle = window.getComputedStyle(icon!);
      expect(computedStyle.color).toBe('rgb(107, 114, 128)'); // Muted color
      expect(computedStyle.width).toBe('18px');
      expect(computedStyle.height).toBe('18px');
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
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      const input = screen.getByRole('combobox');
      
      const wrapperStyle = window.getComputedStyle(wrapper!);
      const inputStyle = window.getComputedStyle(input);
      
      // Dark mode background
      expect(wrapperStyle.backgroundColor).toBe('rgb(31, 41, 55)');
      
      // Text should be light
      expect(inputStyle.color).toBe('rgb(243, 244, 246)');
      
      // Border should be visible but subtle
      expect(wrapperStyle.borderColor).toBe('rgb(55, 65, 81)');
    });

    it('should have enhanced shadows in dark mode', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      const wrapper = container.querySelector('.leaflet-search-input-wrapper');
      
      const computedStyle = window.getComputedStyle(wrapper!);
      expect(computedStyle.boxShadow).toMatch(/0\s+4px\s+12px.*rgba/);
    });
  });

  describe('Dropdown Styling', () => {
    it('should have modern dropdown design with proper spacing', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      // Wait for dropdown
      const dropdown = await screen.findByRole('listbox');
      const computedStyle = window.getComputedStyle(dropdown);
      
      expect(computedStyle.borderRadius).toBe('8px');
      expect(computedStyle.marginTop).toBe('8px');
      expect(computedStyle.boxShadow).toMatch(/0\s+8px\s+16px.*rgba/);
    });

    it('should have hover effects on suggestions', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      const suggestions = await screen.findAllByRole('option');
      const firstSuggestion = suggestions[0];
      
      // Check hover state
      await user.hover(firstSuggestion);
      const computedStyle = window.getComputedStyle(firstSuggestion);
      expect(computedStyle.backgroundColor).toBe('rgb(239, 246, 255)'); // Light blue
      expect(computedStyle.transition).toContain('background-color');
    });

    it('should highlight search terms with proper styling', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Paris');
      
      const highlight = await screen.findByText((content, element) => {
        return element?.tagName === 'MARK' && content === 'Paris';
      });
      
      const computedStyle = window.getComputedStyle(highlight);
      expect(computedStyle.backgroundColor).toBe('rgb(254, 240, 138)'); // Yellow highlight
      expect(computedStyle.fontWeight).toBe('600');
      expect(computedStyle.borderRadius).toBe('2px');
    });
  });

  describe('Interactive States', () => {
    it('should show focus ring on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      await user.tab();
      const input = screen.getByRole('combobox');
      
      const computedStyle = window.getComputedStyle(input);
      expect(computedStyle.outline).toMatch(/2px solid/);
      expect(computedStyle.outlineColor).toBe('rgb(59, 130, 246)'); // Blue
      expect(computedStyle.outlineOffset).toBe('2px');
    });

    it('should have smooth transitions for all interactive elements', () => {
      const { container } = render(<SearchInput {...defaultProps} />);
      
      const clearButton = container.querySelector('.leaflet-search-clear');
      const computedStyle = window.getComputedStyle(clearButton!);
      
      expect(computedStyle.transition).toContain('color');
      expect(computedStyle.transition).toContain('transform');
    });

    it('should scale clear button on hover', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.hover(clearButton);
      
      const computedStyle = window.getComputedStyle(clearButton);
      expect(computedStyle.transform).toBe('scale(1.1)');
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
      
      const computedStyle = window.getComputedStyle(searchControl!);
      expect(computedStyle.width).toBe('calc(100% - 20px)');
    });
  });
});