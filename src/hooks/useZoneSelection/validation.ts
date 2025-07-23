import * as turf from '@turf/turf';
import type { Zone } from '@/types';
import type { SelectionConstraints, ValidationResult } from './types';

/**
 * Validate zone selection against constraints
 */
export function validateConstraints(
  zones: Zone[],
  constraints?: SelectionConstraints
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!constraints) {
    return { valid: true, errors, warnings };
  }

  // Check max selections
  if (constraints.maxSelections !== undefined && zones.length > constraints.maxSelections) {
    errors.push(`Maximum ${constraints.maxSelections} zones can be selected`);
  }

  // Check min selections
  if (constraints.minSelections !== undefined && zones.length < constraints.minSelections) {
    errors.push(`Minimum ${constraints.minSelections} zones must be selected`);
  }

  // Check area constraints
  if (zones.length > 0 && (constraints.maxArea || constraints.minArea)) {
    const totalArea = calculateTotalArea(zones);

    if (constraints.maxArea !== undefined && totalArea > constraints.maxArea) {
      errors.push(`Total area exceeds maximum of ${formatArea(constraints.maxArea)}`);
    }

    if (constraints.minArea !== undefined && totalArea < constraints.minArea) {
      errors.push(`Total area is below minimum of ${formatArea(constraints.minArea)}`);
    }
  }

  // Check distance constraints
  if (constraints.maxDistance !== undefined && zones.length > 1) {
    const maxDistance = calculateMaxDistance(zones);
    
    if (maxDistance > constraints.maxDistance) {
      errors.push(
        `Maximum distance between zones (${formatDistance(maxDistance)}) exceeds limit of ${formatDistance(constraints.maxDistance)}`
      );
    }
  }

  // Check property constraints
  if (constraints.allowedProperties) {
    zones.forEach(zone => {
      const isAllowed = Object.entries(constraints.allowedProperties!).every(
        ([key, value]) => zone.properties?.[key] === value
      );

      if (!isAllowed) {
        errors.push(`Zone "${zone.name}" does not match required properties`);
      }
    });
  }

  // Run custom validator
  if (constraints.customValidator) {
    const customResult = constraints.customValidator(zones);
    
    if (!customResult.valid) {
      errors.push(...customResult.errors);
    }
    
    if (customResult.warnings) {
      warnings.push(...customResult.warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate total area of selected zones
 */
function calculateTotalArea(zones: Zone[]): number {
  return zones.reduce((total, zone) => {
    // Use pre-calculated area if available
    if (zone.properties?.area) {
      return total + zone.properties.area;
    }

    // Calculate area using Turf.js
    const area = turf.area(zone.geometry);
    return total + area;
  }, 0);
}

/**
 * Calculate maximum distance between any two zones
 */
function calculateMaxDistance(zones: Zone[]): number {
  let maxDistance = 0;

  for (let i = 0; i < zones.length - 1; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const centroid1 = turf.centroid(zones[i].geometry);
      const centroid2 = turf.centroid(zones[j].geometry);
      
      const distance = turf.distance(
        centroid1,
        centroid2,
        { units: 'meters' }
      );

      maxDistance = Math.max(maxDistance, distance);
    }
  }

  return maxDistance;
}

/**
 * Format area for display
 */
function formatArea(area: number): string {
  if (area < 10000) {
    return `${Math.round(area)} m²`;
  } else if (area < 1000000) {
    return `${(area / 10000).toFixed(2)} hectares`;
  } else {
    return `${(area / 1000000).toFixed(2)} km²`;
  }
}

/**
 * Format distance for display
 */
function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  } else {
    return `${(distance / 1000).toFixed(2)} km`;
  }
}