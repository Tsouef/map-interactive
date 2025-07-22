# Issue #13: Create Export Functionality (GeoJSON, KML, CSV)

**Labels**: feature, export, formats, medium-priority

## Description

Implement comprehensive export functionality that allows users to export selected zones in various formats including GeoJSON, KML, CSV, and WKT, with customizable properties and formatting options.

## Acceptance Criteria

- [ ] Export to GeoJSON with full geometry and properties
- [ ] Export to KML for Google Earth compatibility
- [ ] Export to CSV with coordinates and metrics
- [ ] Export to WKT for database storage
- [ ] Include zone properties and metrics in exports
- [ ] Support custom property mapping
- [ ] Provide download functionality
- [ ] Support clipboard copy option

## Technical Implementation

### Export Service
```typescript
// src/utils/exportFormats/exportService.ts
import * as turf from '@turf/turf';
import { saveAs } from 'file-saver';
import type { Zone, ExportOptions, SelectionMetrics } from '@/types';

export class ExportService {
  /**
   * Export zones in specified format
   */
  static async exportZones(
    zones: Zone[],
    options: ExportOptions
  ): Promise<string | Blob> {
    const {
      format,
      includeProperties = true,
      includeMetrics = false,
      simplify = false,
      simplifyTolerance = 0.001,
      precision = 6,
      propertyMapper,
      fileName = 'zones'
    } = options;
    
    // Prepare zones for export
    const processedZones = this.preprocessZones(zones, {
      simplify,
      simplifyTolerance,
      precision
    });
    
    // Calculate metrics if needed
    let metrics: SelectionMetrics | undefined;
    if (includeMetrics) {
      const { MetricsCalculator } = await import('../metricsCalculator');
      metrics = MetricsCalculator.calculateSelectionMetrics(zones);
    }
    
    // Export based on format
    switch (format) {
      case 'geojson':
        return this.exportGeoJSON(processedZones, { includeProperties, propertyMapper, metrics });
      
      case 'kml':
        return this.exportKML(processedZones, { includeProperties, propertyMapper });
      
      case 'csv':
        return this.exportCSV(processedZones, { includeProperties, metrics });
      
      case 'wkt':
        return this.exportWKT(processedZones);
      
      case 'topojson':
        return this.exportTopoJSON(processedZones, { includeProperties });
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Download exported data as file
   */
  static downloadExport(
    data: string | Blob,
    format: ExportOptions['format'],
    fileName: string = 'zones'
  ): void {
    const extensions: Record<ExportOptions['format'], string> = {
      geojson: 'geojson',
      kml: 'kml',
      csv: 'csv',
      wkt: 'txt',
      topojson: 'json'
    };
    
    const mimeTypes: Record<ExportOptions['format'], string> = {
      geojson: 'application/geo+json',
      kml: 'application/vnd.google-earth.kml+xml',
      csv: 'text/csv',
      wkt: 'text/plain',
      topojson: 'application/json'
    };
    
    const blob = data instanceof Blob 
      ? data 
      : new Blob([data], { type: mimeTypes[format] });
    
    saveAs(blob, `${fileName}.${extensions[format]}`);
  }
  
  /**
   * Copy to clipboard
   */
  static async copyToClipboard(data: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(data);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = data;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
  
  /**
   * Preprocess zones before export
   */
  private static preprocessZones(
    zones: Zone[],
    options: {
      simplify: boolean;
      simplifyTolerance: number;
      precision: number;
    }
  ): Zone[] {
    return zones.map(zone => {
      let geometry = zone.geometry;
      
      // Simplify if requested
      if (options.simplify) {
        const feature = turf.feature(geometry);
        const simplified = turf.simplify(feature, {
          tolerance: options.simplifyTolerance,
          highQuality: true
        });
        geometry = simplified.geometry as typeof geometry;
      }
      
      // Truncate coordinates to specified precision
      geometry = turf.truncate(turf.feature(geometry), {
        precision: options.precision
      }).geometry as typeof geometry;
      
      return { ...zone, geometry };
    });
  }
  
  /**
   * Export as GeoJSON
   */
  private static exportGeoJSON(
    zones: Zone[],
    options: {
      includeProperties: boolean;
      propertyMapper?: (zone: Zone) => Record<string, any>;
      metrics?: SelectionMetrics;
    }
  ): string {
    const features = zones.map(zone => {
      const properties = options.includeProperties
        ? options.propertyMapper
          ? options.propertyMapper(zone)
          : {
              id: zone.id,
              name: zone.name,
              ...zone.properties
            }
        : { id: zone.id, name: zone.name };
      
      // Add metrics if available
      if (options.metrics) {
        const zoneMetrics = options.metrics.zones.find(zm => zm.zoneId === zone.id);
        if (zoneMetrics) {
          properties._metrics = {
            area_m2: zoneMetrics.area.squareMeters,
            perimeter_m: zoneMetrics.perimeter
          };
        }
      }
      
      return turf.feature(zone.geometry, properties);
    });
    
    const featureCollection = turf.featureCollection(features);
    
    // Add collection-level metadata
    if (options.metrics) {
      featureCollection.properties = {
        totalArea: options.metrics.total.area.squareMeters,
        totalPerimeter: options.metrics.total.perimeter,
        zoneCount: zones.length,
        exportDate: new Date().toISOString()
      };
    }
    
    return JSON.stringify(featureCollection, null, 2);
  }
  
  /**
   * Export as KML
   */
  private static exportKML(
    zones: Zone[],
    options: {
      includeProperties: boolean;
      propertyMapper?: (zone: Zone) => Record<string, any>;
    }
  ): string {
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Zone Selection Export</name>
    <description>Exported from Leaflet Zone Selector</description>
    <Style id="zoneStyle">
      <LineStyle>
        <color>ff0066ff</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>7f0066ff</color>
      </PolyStyle>
    </Style>`;
    
    const placemarks = zones.map(zone => {
      const properties = options.propertyMapper?.(zone) || {
        id: zone.id,
        name: zone.name,
        ...zone.properties
      };
      
      const coordinates = this.geometryToKMLCoordinates(zone.geometry);
      
      const extendedData = options.includeProperties
        ? `
      <ExtendedData>
        ${Object.entries(properties)
          .filter(([key]) => key !== 'name')
          .map(([key, value]) => `
        <Data name="${this.escapeXML(key)}">
          <value>${this.escapeXML(String(value))}</value>
        </Data>`).join('')}
      </ExtendedData>`
        : '';
      
      return `
    <Placemark>
      <name>${this.escapeXML(zone.name)}</name>
      <styleUrl>#zoneStyle</styleUrl>${extendedData}
      ${coordinates}
    </Placemark>`;
    }).join('');
    
    const kmlFooter = `
  </Document>
</kml>`;
    
    return kmlHeader + placemarks + kmlFooter;
  }
  
  /**
   * Export as CSV
   */
  private static exportCSV(
    zones: Zone[],
    options: {
      includeProperties: boolean;
      metrics?: SelectionMetrics;
    }
  ): string {
    // Headers
    const headers = [
      'id',
      'name',
      'geometry_type',
      'centroid_lng',
      'centroid_lat',
      'bbox_min_lng',
      'bbox_min_lat',
      'bbox_max_lng',
      'bbox_max_lat'
    ];
    
    if (options.metrics) {
      headers.push('area_m2', 'perimeter_m');
    }
    
    if (options.includeProperties) {
      // Collect all unique property keys
      const propertyKeys = new Set<string>();
      zones.forEach(zone => {
        if (zone.properties) {
          Object.keys(zone.properties).forEach(key => propertyKeys.add(key));
        }
      });
      headers.push(...Array.from(propertyKeys));
    }
    
    // Rows
    const rows = zones.map(zone => {
      const centroid = turf.centroid(turf.feature(zone.geometry));
      const bbox = turf.bbox(turf.feature(zone.geometry));
      
      const row: any[] = [
        zone.id,
        zone.name,
        zone.geometry.type,
        centroid.geometry.coordinates[0],
        centroid.geometry.coordinates[1],
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3]
      ];
      
      if (options.metrics) {
        const zoneMetrics = options.metrics.zones.find(zm => zm.zoneId === zone.id);
        row.push(
          zoneMetrics?.area.squareMeters || 0,
          zoneMetrics?.perimeter || 0
        );
      }
      
      if (options.includeProperties) {
        headers.slice(row.length).forEach(header => {
          row.push(zone.properties?.[header] || '');
        });
      }
      
      return row;
    });
    
    // Format as CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n');
    
    return csv;
  }
  
  /**
   * Export as WKT
   */
  private static exportWKT(zones: Zone[]): string {
    return zones.map(zone => {
      const wkt = this.geometryToWKT(zone.geometry);
      return `${zone.id}\t${wkt}`;
    }).join('\n');
  }
  
  /**
   * Convert GeoJSON geometry to WKT
   */
  private static geometryToWKT(geometry: GeoJSON.Geometry): string {
    switch (geometry.type) {
      case 'Polygon':
        return `POLYGON(${geometry.coordinates.map(ring => 
          `(${ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`
        ).join(', ')})`;
      
      case 'MultiPolygon':
        return `MULTIPOLYGON(${geometry.coordinates.map(polygon => 
          `(${polygon.map(ring => 
            `(${ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`
          ).join(', ')})`
        ).join(', ')})`;
      
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }
  
  /**
   * Convert geometry to KML coordinate string
   */
  private static geometryToKMLCoordinates(geometry: GeoJSON.Geometry): string {
    if (geometry.type === 'Polygon') {
      return `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${geometry.coordinates[0].map(coord => 
                `${coord[0]},${coord[1]},0`
              ).join(' ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
        ${geometry.coordinates.slice(1).map(ring => `
        <innerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${ring.map(coord => `${coord[0]},${coord[1]},0`).join(' ')}
            </coordinates>
          </LinearRing>
        </innerBoundaryIs>`).join('')}
      </Polygon>`;
    } else if (geometry.type === 'MultiPolygon') {
      return `
      <MultiGeometry>
        ${geometry.coordinates.map(polygon => 
          this.geometryToKMLCoordinates({ type: 'Polygon', coordinates: polygon })
        ).join('')}
      </MultiGeometry>`;
    }
    
    throw new Error(`Unsupported geometry type for KML: ${geometry.type}`);
  }
  
  /**
   * Escape XML special characters
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
```

### Export UI Component
```tsx
// src/components/ExportDialog/ExportDialog.tsx
import React, { useState } from 'react';
import { ExportService } from '@/utils/exportFormats/exportService';
import type { Zone, ExportFormat } from '@/types';
import './ExportDialog.css';

interface ExportDialogProps {
  zones: Zone[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  zones,
  isOpen,
  onClose,
  className
}) => {
  const [format, setFormat] = useState<ExportFormat>('geojson');
  const [includeProperties, setIncludeProperties] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = await ExportService.exportZones(zones, {
        format,
        includeProperties,
        includeMetrics,
        simplify,
        fileName: 'zone-selection'
      });
      
      ExportService.downloadExport(data, format, 'zone-selection');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    
    try {
      const data = await ExportService.exportZones(zones, {
        format,
        includeProperties,
        includeMetrics,
        simplify
      });
      
      await ExportService.copyToClipboard(data as string);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Copy to clipboard failed.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className={`export-dialog-overlay ${className || ''}`}>
      <div className="export-dialog">
        <h2>Export Zone Selection</h2>
        
        <div className="export-dialog__info">
          Exporting {zones.length} zone{zones.length !== 1 ? 's' : ''}
        </div>
        
        <div className="export-dialog__options">
          <div className="form-group">
            <label>Format</label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="geojson">GeoJSON</option>
              <option value="kml">KML (Google Earth)</option>
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="wkt">WKT (Database)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={includeProperties}
                onChange={(e) => setIncludeProperties(e.target.checked)}
              />
              Include zone properties
            </label>
          </div>
          
          {(format === 'geojson' || format === 'csv') && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                />
                Include area and perimeter metrics
              </label>
            </div>
          )}
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e) => setSimplify(e.target.checked)}
              />
              Simplify geometry (smaller file size)
            </label>
          </div>
        </div>
        
        <div className="export-dialog__actions">
          <button 
            onClick={onClose} 
            disabled={isExporting}
            className="button button--secondary"
          >
            Cancel
          </button>
          <button 
            onClick={handleCopyToClipboard}
            disabled={isExporting || format === 'csv'}
            className="button button--secondary"
          >
            Copy to Clipboard
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="button button--primary"
          >
            {isExporting ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Testing Requirements

- [ ] GeoJSON export includes all properties
- [ ] KML renders correctly in Google Earth
- [ ] CSV opens properly in Excel/Sheets
- [ ] WKT imports into PostGIS
- [ ] Large exports don't crash browser
- [ ] Clipboard copy works across browsers
- [ ] File downloads have correct names
- [ ] Metrics calculation is accurate

## Usage Example

```tsx
const mapRef = useRef<LeafletZoneSelectorRef>(null);

const handleExport = () => {
  const selectedZones = mapRef.current?.getSelectedZones();
  
  ExportService.exportZones(selectedZones, {
    format: 'geojson',
    includeMetrics: true,
    propertyMapper: (zone) => ({
      id: zone.id,
      name: zone.name,
      customerId: 'CUST-123',
      deliveryFee: calculateDeliveryFee(zone)
    })
  }).then(data => {
    ExportService.downloadExport(data, 'geojson', 'delivery-zones');
  });
};
```

## Related Issues

- #12: Include metrics in exports
- #11: Export drawn shapes
- #4: Export functionality in main component