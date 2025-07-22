import type {
  ZoneVisualState,
  ZoneStyle,
  ThemeConfig,
  PresetTheme,
} from '../theme';

describe('Theme Types', () => {
  it('should accept valid ZoneStyle', () => {
    const style: ZoneStyle = {
      fillColor: '#3388ff',
      fillOpacity: 0.2,
      color: '#3388ff',
      weight: 2,
      opacity: 1,
      dashArray: '3',
      lineCap: 'round',
      lineJoin: 'round',
      transitionDuration: 200,
      className: 'zone-default',
      cursor: 'pointer',
    };
    
    expect(style.fillColor).toBe('#3388ff');
    expect(style.transitionDuration).toBe(200);
  });

  it('should accept all ZoneVisualState values', () => {
    const states: ZoneVisualState[] = ['default', 'hover', 'selected', 'disabled', 'error'];
    
    states.forEach(state => {
      expect(states).toContain(state);
    });
  });

  it('should accept valid ThemeConfig', () => {
    const theme: ThemeConfig = {
      name: 'light',
      zoneStyles: {
        default: {
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          color: '#3388ff',
          weight: 2,
        },
        hover: {
          fillOpacity: 0.4,
          weight: 3,
        },
        selected: {
          fillColor: '#ff7800',
          fillOpacity: 0.4,
          color: '#ff7800',
        },
        disabled: {
          fillOpacity: 0.1,
          opacity: 0.5,
        },
        error: {
          fillColor: '#ff0000',
          color: '#ff0000',
        },
      },
      mapStyles: {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
      },
      componentStyles: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        border: '#dee2e6',
        error: '#dc3545',
        warning: '#ffc107',
        success: '#28a745',
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.25rem',
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '3rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    };
    
    expect(theme.name).toBe('light');
    expect(theme.zoneStyles.default.fillColor).toBe('#3388ff');
    expect(theme.componentStyles.primary).toBe('#007bff');
  });

  it('should accept all PresetTheme values', () => {
    const presets: PresetTheme[] = ['light', 'dark', 'contrast', 'colorblind'];
    
    presets.forEach(preset => {
      expect(presets).toContain(preset);
    });
  });

  it('should accept partial ZoneStyle for state overrides', () => {
    const hoverStyle: ZoneStyle = {
      fillOpacity: 0.6,
      cursor: 'pointer',
    };
    
    expect(hoverStyle.fillOpacity).toBe(0.6);
    expect(hoverStyle.fillColor).toBeUndefined();
  });
});