# 🗺️ Leaflet Zone Selector

A powerful React component for interactive geographic zone selection using Leaflet and OpenStreetMap. Select cities, districts, or draw custom areas with automatic polygon merging and comprehensive export options.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![React](https://img.shields.io/badge/React-18%2B-blue)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9%2B-green)

## ✨ Features

- 🗺️ **Free & Open Source** - Uses OpenStreetMap tiles, no API key required
- 🎯 **Interactive Selection** - Click to select/deselect zones
- 🔄 **Smart Merging** - Automatically merges adjacent selected zones
- 🔍 **Address Search** - Search by address, postal code, or place name
- ✏️ **Drawing Tools** - Draw custom zones with polygon, circle, or freehand tools
- 📊 **Metrics** - Calculate area, perimeter, and other geographic metrics
- 💾 **Export Options** - Export as GeoJSON, KML, CSV, or WKT
- 🎨 **Fully Customizable** - Themes, styles, and behaviors
- ♿ **Accessible** - WCAG 2.1 AA compliant with keyboard navigation
- 🚀 **Performant** - Optimized for 1000+ zones

## 📦 Installation

```bash
# npm
npm install leaflet-zone-selector

# yarn
yarn add leaflet-zone-selector

# pnpm
pnpm add leaflet-zone-selector
```

## 🚀 Quick Start

```tsx
import { LeafletZoneSelector } from 'leaflet-zone-selector';
import 'leaflet-zone-selector/dist/leaflet-zone-selector.css';

function App() {
  const handleSelectionChange = (zones) => {
    console.log('Selected zones:', zones);
    // zones = [{ id, name, geometry, properties }]
  };

  return (
    <div style={{ height: '500px' }}>
      <LeafletZoneSelector
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
```

## 📖 Documentation

### Basic Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialCenter` | `[number, number]` | `[48.8566, 2.3522]` | Initial map center (Paris) |
| `initialZoom` | `number` | `12` | Initial zoom level |
| `multiSelect` | `boolean` | `true` | Enable multiple zone selection |
| `maxSelections` | `number` | `Infinity` | Maximum number of selections |
| `enableSearch` | `boolean` | `true` | Show search input |
| `enableDrawing` | `boolean` | `false` | Enable drawing tools |
| `theme` | `'light' \| 'dark' \| ThemeConfig` | `'light'` | Visual theme |

### Callbacks

```tsx
<LeafletZoneSelector
  onSelectionChange={(zones) => {
    // Called when selection changes
    // zones: Array of selected Zone objects
  }}
  onZoneClick={(zone, event) => {
    // Called when a zone is clicked
  }}
  onZoneHover={(zone) => {
    // Called when hovering over a zone
  }}
  onError={(error) => {
    // Handle errors
  }}
/>
```

### Advanced Usage

```tsx
import { LeafletZoneSelector, LeafletZoneSelectorRef } from 'leaflet-zone-selector';

function AdvancedExample() {
  const mapRef = useRef<LeafletZoneSelectorRef>(null);
  
  const handleExport = () => {
    // Export selected zones as GeoJSON
    const geojson = mapRef.current?.exportSelection('geojson');
    downloadFile(geojson, 'zones.geojson');
  };
  
  const selectByPostalCode = (postalCode: string) => {
    // Programmatically select zones
    mapRef.current?.selectByPredicate(
      zone => zone.properties?.postalCode === postalCode
    );
  };
  
  return (
    <>
      <LeafletZoneSelector
        ref={mapRef}
        zones={customZoneData}
        constraints={{
          maxArea: 50000000, // 50 km²
          adjacentOnly: true
        }}
        theme={{
          colors: {
            primary: '#00D084',
            selected: '#0066CC'
          }
        }}
      />
      <button onClick={handleExport}>Export Selection</button>
    </>
  );
}
```

### Loading Zone Data

```tsx
// Option 1: Provide zones directly
const zones = [
  {
    id: 'paris-1',
    name: 'Paris 1er Arrondissement',
    geometry: { type: 'Polygon', coordinates: [...] },
    properties: { postalCode: '75001' }
  }
];

<LeafletZoneSelector zones={zones} />

// Option 2: Load zones asynchronously
<LeafletZoneSelector
  loadZonesAsync={async () => {
    const response = await fetch('/api/zones');
    return response.json();
  }}
/>
```

## 🎨 Styling

### CSS Variables

```css
.leaflet-zone-selector {
  --zone-default-fill: rgba(59, 130, 246, 0.1);
  --zone-default-stroke: #3b82f6;
  --zone-hover-fill: rgba(59, 130, 246, 0.2);
  --zone-selected-fill: rgba(59, 130, 246, 0.3);
  --zone-selected-stroke: #1d4ed8;
}
```

### Custom Theme

```tsx
const darkTheme = {
  name: 'dark',
  zoneStyles: {
    default: {
      fillColor: '#1a1a1a',
      fillOpacity: 0.3,
      color: '#4a5568',
      weight: 1
    },
    selected: {
      fillColor: '#2563eb',
      fillOpacity: 0.4,
      color: '#3b82f6',
      weight: 2
    }
  }
};

<LeafletZoneSelector theme={darkTheme} />
```

## 🛠️ API Reference

### Component Props

See [API Documentation](./docs/API.md) for complete reference.

### Ref Methods

```typescript
interface LeafletZoneSelectorRef {
  // Map control
  setView(center: [number, number], zoom?: number): void;
  fitBounds(bounds: L.LatLngBounds): void;
  
  // Selection
  selectZones(zoneIds: string[]): void;
  clearSelection(): void;
  getSelectedZones(): Zone[];
  
  // Export
  exportSelection(format: 'geojson' | 'kml' | 'csv' | 'wkt'): string | Blob;
  getSelectionMetrics(): SelectionMetrics;
}
```

## 🏗️ Examples

### Delivery Zone Management
```tsx
// Define delivery areas for a restaurant
<LeafletZoneSelector
  multiSelect={true}
  enableDrawing={true}
  onSelectionChange={(zones) => {
    const totalArea = zones.reduce((sum, z) => sum + z.properties.area, 0);
    const deliveryFee = calculateFeeByArea(totalArea);
    updateDeliveryZones(zones, deliveryFee);
  }}
/>
```

### Territory Planning
```tsx
// Assign sales territories
<LeafletZoneSelector
  zones={cityDistricts}
  constraints={{ adjacentOnly: true }}
  getZoneStyle={(zone) => ({
    fillColor: getTeamColor(zone.properties.assignedTeam)
  })}
/>
```

### Service Area Analysis
```tsx
// Analyze coverage areas
const ref = useRef<LeafletZoneSelectorRef>(null);

const analyzeServiceArea = () => {
  const metrics = ref.current?.getSelectionMetrics();
  console.log(`Total coverage: ${metrics.totalArea} m²`);
  console.log(`Population covered: ${metrics.estimatedPopulation}`);
};
```

## 🧪 Development

```bash
# Clone repository
git clone https://github.com/yourusername/leaflet-zone-selector.git
cd leaflet-zone-selector

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build library
pnpm build
```

## 📄 License

MIT © [Your Name]

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

## 🔗 Links

- [Documentation](https://leaflet-zone-selector.dev)
- [Examples](https://github.com/yourusername/leaflet-zone-selector/tree/main/examples)
- [Issues](https://github.com/yourusername/leaflet-zone-selector/issues)
- [Changelog](./CHANGELOG.md)

## 🙏 Credits

- Built with [Leaflet](https://leafletjs.com/)
- Powered by [OpenStreetMap](https://www.openstreetmap.org/)
- Geographic calculations by [Turf.js](https://turfjs.org/)