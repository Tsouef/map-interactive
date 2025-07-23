import type { PathOptions } from 'leaflet';

/**
 * Zone visual state
 */
export type ZoneVisualState = 'default' | 'hover' | 'selected' | 'disabled' | 'error';

/**
 * Style configuration for a visual state
 */
export interface ZoneStyle extends PathOptions {
  /** Transition duration in ms */
  transitionDuration?: number;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Cursor style */
  cursor?: string;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  /** Theme name */
  name: string;
  
  /** Zone styles by state */
  zoneStyles: Record<ZoneVisualState, ZoneStyle>;
  
  /** Map container styles */
  mapStyles: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  
  /** UI component styles */
  componentStyles: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  
  /** Typography */
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  
  /** Spacing scale */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  /** Border radius scale */
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  /** Shadow scale */
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Preset theme names
 */
export type PresetTheme = 'light' | 'dark' | 'contrast' | 'colorblind';