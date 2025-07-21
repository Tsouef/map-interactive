# Mapbox Zone Selector

A lightweight React/TypeScript library for creating interactive maps with geographic zone selection using Mapbox. Works with cities worldwide - click on cities or urban areas to create polygons, merge adjacent zones, and export coordinates.

## 🎯 Core Features

- **Global Coverage**: Works with cities worldwide using OpenStreetMap and Mapbox data
- **Interactive Zone Selection**: Click on cities or urban districts to select them
- **Smart City Division**: Large cities (like Paris, London, NYC, Tokyo) are automatically divided into districts/boroughs/wards
- **Polygon Creation**: Automatically creates polygons with coordinate points when clicking on zones
- **Adjacent Zone Merging**: Selected zones that touch each other automatically merge into one larger polygon
- **Toggle Selection**: Click again on a selected zone to deselect it
- **Postal Code Search**: Add zones by entering postal codes (supports international formats)
- **Multiple Polygons**: Handle multiple non-adjacent selected areas simultaneously
- **Coordinate Export**: Returns an array of coordinates for all selected zones

## 📦 Installation

### pnpm (recommended)

```bash
pnpm add mapbox-zone-selector
```

### npm

```bash
npm install mapbox-zone-selector
```

### yarn

```bash
yarn add mapbox-zone-selector
```

## 🚀 Quick Start

```tsx
import { MapboxZoneSelector } from "mapbox-zone-selector";
import type { Coordinates } from "mapbox-zone-selector";

function App() {
  const handleCoordinatesChange = (coordinates: Coordinates[][]) => {
    console.log("Selected zone coordinates:", coordinates);
    // coordinates = [
    //   [[lng1, lat1], [lng2, lat2], ...], // First polygon
    //   [[lng3, lat3], [lng4, lat4], ...]  // Second polygon if non-adjacent
    // ]
  };

  return (
    <MapboxZoneSelector
      mapboxToken="YOUR_MAPBOX_TOKEN"
      initialCenter={[2.3522, 48.8566]} // Paris
      onCoordinatesChange={handleCoordinatesChange}
    />
  );
}
```

## 📖 Core Functionality

### Zone Selection Behavior

1. **Click to Select**: Click any city or district to select it and create a polygon
2. **Large Cities**: Cities like Paris are divided into clickable districts (e.g., "18th arrondissement")
3. **Automatic Merging**: When you select two adjacent zones, they automatically merge into one polygon
4. **Toggle Selection**: Click a selected zone again to deselect it
5. **Final Output**: Get an array of all polygon coordinates

### Example Scenarios

```tsx
// Scenario 1: Selecting city districts
// Click on "Manhattan" (NYC) → Creates polygon for that borough
// Click on "Brooklyn" → Merges with Manhattan into one larger polygon
// Click on "Newark" (adjacent city) → Adds to the merged area
// Result: One large merged polygon

// Scenario 2: Non-adjacent selections
// Click on "Westminster" (London)
// Click on "Shibuya" (Tokyo) - not adjacent
// Result: Two separate polygons in the coordinates array

// Scenario 3: Mixed granularity
// Click on "18th arrondissement" (Paris district)
// Click on entire "Versailles" (nearby city)
// Result: Merged polygon combining district + city
```

## 🔧 Component Props

```typescript
interface MapboxZoneSelectorProps {
  // Required
  mapboxToken: string; // Your Mapbox GL token

  // Optional - Map Configuration
  initialCenter?: [number, number]; // Initial map center [lng, lat]
  initialZoom?: number; // Initial zoom level (default: 11)
  height?: string | number; // Component height (default: '500px')
  width?: string | number; // Component width (default: '100%')

  // Optional - Behavior
  multiSelect?: boolean; // Allow multiple zone selection (default: true)
  autoMerge?: boolean; // Auto-merge adjacent zones (default: true)
  clickToggle?: boolean; // Click to deselect (default: true)

  // Optional - Advanced Features
  enableDrawing?: boolean; // Enable drawing tools (default: false)
  drawingMode?: "polygon" | "circle" | "rectangle"; // Drawing mode
  enableRadiusSelection?: boolean; // Enable radius selection tool
  enableHistory?: boolean; // Enable undo/redo (default: true)
  historyLimit?: number; // Max undo steps (default: 50)
  showMetrics?: boolean; // Display area/perimeter (default: false)
  performanceMode?: "auto" | "high" | "balanced" | "quality";

  // Optional - Constraints
  constraints?: SelectionConstraints; // Selection rules and limits

  // Optional - Localization
  language?: string; // Map language (default: 'en')
  locale?: string; // Locale for formatting (default: 'en-US')
  boundariesSource?: "osm" | "mapbox"; // Boundary data source (default: 'mapbox')

  // Optional - Styling
  selectedColor?: string; // Selected zone color (default: '#3498db')
  selectedOpacity?: number; // Selected zone opacity (default: 0.4)
  borderColor?: string; // Zone border color (default: '#2c3e50')
  borderWidth?: number; // Zone border width (default: 2)

  // Callbacks
  onCoordinatesChange?: (coordinates: Coordinates[][]) => void;
  onZoneClick?: (zone: Zone) => void;
  onZoneSelect?: (zone: Zone) => void;
  onZoneDeselect?: (zone: Zone) => void;
  onZonesMerged?: (mergedZones: string[]) => void;
}
```

## 🎮 API Methods via Ref

```tsx
import { useRef } from "react";
import { MapboxZoneSelector, MapboxZoneSelectorRef } from "mapbox-zone-selector";

function App() {
  const mapRef = useRef<MapboxZoneSelectorRef>(null);

  const selectByPostalCode = (postalCode: string) => {
    mapRef.current?.selectByPostalCode(postalCode);
  };

  const selectByRadius = () => {
    mapRef.current?.selectWithinRadius({
      center: mapRef.current.getMapCenter(),
      radius: 3,
      unit: "kilometers",
    });
  };

  const exportCoordinates = () => {
    const data = mapRef.current?.exportSelection({
      format: "geojson",
      includeMetrics: true,
      precision: 6,
    });
    console.log("Exported data:", data);
  };

  const getCoordinates = () => {
    const coords = mapRef.current?.getCoordinates();
    console.log("Current coordinates:", coords);
  };

  const clearAll = () => {
    mapRef.current?.clearSelection();
  };

  return (
    <>
      <MapboxZoneSelector ref={mapRef} mapboxToken={TOKEN} />

      <button onClick={() => selectByPostalCode("75018")}>Select 75018 (Paris 18th)</button>
      <button onClick={() => selectByPostalCode("SW1A 1AA")}>Select Westminster (London)</button>
      <button onClick={() => selectByPostalCode("10001")}>Select Manhattan (NYC)</button>
      <button onClick={selectByRadius}>Select 3km Radius</button>
      <button onClick={exportCoordinates}>Export Selection</button>
      <button onClick={getCoordinates}>Get Coordinates</button>
      <button onClick={clearAll}>Clear Selection</button>
    </>
  );
}
```

### Available Methods

```typescript
interface MapboxZoneSelectorRef {
  // Selection methods
  selectZone(zoneId: string): void;
  deselectZone(zoneId: string): void;
  toggleZone(zoneId: string): void;
  selectByPostalCode(postalCode: string): void;
  selectMultipleByPostalCodes(postalCodes: string[]): void;
  selectWithinRadius(options: { center: Coordinates; radius: number; unit: string }): void;
  clearSelection(): void;

  // Drawing methods
  startDrawing(mode: "polygon" | "circle" | "rectangle"): void;
  stopDrawing(): void;
  deleteLastPoint(): void;

  // Data retrieval
  getCoordinates(): Coordinates[][]; // Returns array of polygon coordinates
  getSelectedZones(): Zone[]; // Returns selected zone objects
  getSelectedPostalCodes(): string[]; // Returns postal codes of selected zones
  getMergedPolygons(): GeoJSON.Feature[]; // Returns merged polygons as GeoJSON
  getMapCenter(): Coordinates; // Returns current map center
  getZoneMetrics(zoneId: string): ZoneMetrics; // Get metrics for specific zone

  // Import/Export
  exportAsGeoJSON(): GeoJSON.FeatureCollection;
  exportAsKML(): string;
  exportAsCSV(options?: { columns: string[] }): string;
  exportSelection(options: ExportOptions): string | Blob;
  importFile(file: File, options?: { format?: string; append?: boolean }): Promise<void>;

  // Utility
  fitToSelection(): void; // Zoom map to fit selected zones
  validateConstraints(): { valid: boolean; violations: string[] };
}
```

## 🔥 Advanced Features

### Zone Metrics & Calculations

The library automatically calculates geographic metrics for selected zones:

```typescript
interface ZoneMetrics {
  area: number; // Area in km²
  perimeter: number; // Perimeter in km
  center: [number, number]; // Centroid coordinates
  bbox: [[number, number], [number, number]]; // Bounding box
}

// Usage
<MapboxZoneSelector
  onZoneSelect={(zone, metrics: ZoneMetrics) => {
    console.log(`Selected ${zone.name}: ${metrics.area.toFixed(2)} km²`);
  }}
  showMetrics={true} // Display metrics on map
/>;
```

### Drawing Custom Zones

Create custom zones by drawing on the map:

```typescript
<MapboxZoneSelector
  enableDrawing={true}
  drawingMode="polygon" // 'polygon', 'circle', 'rectangle'
  onCustomZoneDrawn={(geometry, coordinates) => {
    console.log("Custom zone created:", coordinates);
  }}
/>;

// Control drawing programmatically
mapRef.current?.startDrawing("circle");
mapRef.current?.stopDrawing();
mapRef.current?.deleteLastPoint();
```

### Selection by Radius

Select all zones within a specified radius:

```typescript
// Select zones within radius
mapRef.current?.selectWithinRadius({
  center: [longitude, latitude],
  radius: 5,
  unit: "kilometers", // 'kilometers', 'miles', 'meters'
});

// UI component for radius selection
<MapboxZoneSelector
  enableRadiusSelection={true}
  onRadiusSelection={(center, radius, selectedZones) => {
    console.log(`Found ${selectedZones.length} zones within ${radius}km`);
  }}
/>;
```

### Undo/Redo Support

Built-in history management for user actions:

```typescript
import { MapboxZoneSelector, useSelectionHistory } from "mapbox-zone-selector";

function MapWithHistory() {
  const { undo, redo, canUndo, canRedo, clearHistory } = useSelectionHistory();

  return (
    <>
      <div className="controls">
        <button onClick={undo} disabled={!canUndo}>
          ↶ Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          ↷ Redo
        </button>
        <button onClick={clearHistory}>Clear History</button>
      </div>
      <MapboxZoneSelector
        mapboxToken={TOKEN}
        enableHistory={true}
        historyLimit={50} // Maximum history steps
      />
    </>
  );
}
```

### Import/Export Capabilities

Support for multiple file formats:

```typescript
// Import zones from file
const handleFileImport = async (file: File) => {
  await mapRef.current?.importFile(file, {
    format: "auto", // Auto-detect or specify: 'geojson', 'kml', 'csv'
    append: true, // Add to existing selection or replace
  });
};

// Export with options
const handleExport = () => {
  const data = mapRef.current?.exportSelection({
    format: "kml", // 'geojson', 'kml', 'csv'
    includeMetrics: true, // Add area, perimeter to export
    simplify: true, // Simplify complex polygons
    precision: 6, // Coordinate decimal places
  });

  downloadFile(data, `zones-${Date.now()}.kml`);
};

// CSV Export with custom columns
const csvData = mapRef.current?.exportAsCSV({
  columns: ["name", "postalCode", "area", "center_lat", "center_lng"],
});
```

### Selection Constraints

Set rules and limits for zone selection:

```typescript
<MapboxZoneSelector
  constraints={{
    maxZones: 10, // Maximum number of zones
    maxTotalArea: 1000, // Maximum total area in km²
    minZoneArea: 0.5, // Minimum area per zone in km²
    allowOverlap: false, // Prevent overlapping selections
    boundingBox: [
      // Limit selection to geographic bounds
      [-74.3, 40.5], // Southwest corner
      [-73.7, 40.9], // Northeast corner
    ],
  }}
  onConstraintViolation={(violation) => {
    toast.error(`Cannot select: ${violation.message}`);
  }}
/>
```

### Performance Optimization

Handle large datasets efficiently:

```typescript
<MapboxZoneSelector
  performanceMode="auto" // 'auto', 'high', 'balanced', 'quality'
  simplificationTolerance={0.01} // Simplify polygons for performance
  clusterSmallZones={true} // Group small zones at low zoom levels
  virtualization={{
    enabled: true,
    maxVisibleZones: 1000,
    bufferSize: 100,
  }}
/>
```

## 📍 Coordinate System & Postal Codes

### Coordinate Format

The library returns coordinates in the standard GeoJSON format:

- Coordinates are returned as `[longitude, latitude]` pairs
- Each polygon is an array of coordinate pairs
- The final output is an array of polygons (for handling non-adjacent selections)

### Postal Code Support

The library supports international postal code formats:

- **USA**: 5-digit ZIP codes (e.g., "10001")
- **UK**: Alphanumeric postcodes (e.g., "SW1A 1AA")
- **Canada**: Alphanumeric with space (e.g., "M5V 3A8")
- **France**: 5-digit codes (e.g., "75018")
- **Germany**: 5-digit PLZ (e.g., "10115")
- **Japan**: 7-digit with hyphen (e.g., "150-0041")
- **Australia**: 4-digit codes (e.g., "2000")
- And many more international formats...

```typescript
type Coordinates = [number, number]; // [longitude, latitude]

// Example output for merged zones:
const coordinates = [
  [
    // Single merged polygon
    [-0.1276, 51.5074], // London coordinates
    [-0.1259, 51.508],
    [-0.1243, 51.5069],
    [-0.1276, 51.5074], // Closing coordinate
  ],
];

// Example output for non-adjacent zones:
const coordinates = [
  [
    // First polygon (Manhattan, NYC)
    [-74.006, 40.7128],
    [-73.9712, 40.7831],
    // ...
  ],
  [
    // Second polygon (Tokyo district)
    [139.6917, 35.6895],
    [139.7109, 35.7023],
    // ...
  ],
];
```

## 🗺️ Supported Geographic Data

### Global City Support

The library works with cities worldwide and automatically handles different administrative divisions:

- **Large Metropolitan Areas**: Automatically divided into districts, boroughs, or administrative zones

  - Paris: 20 arrondissements
  - London: 32 boroughs + City of London
  - New York: 5 boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
  - Tokyo: 23 special wards
  - Berlin: 12 districts (Bezirke)
  - Barcelona: 10 districts
  - Mumbai: 24 wards
  - São Paulo: 32 subprefectures
  - And many more...

- **Standard Cities**: Selectable as complete city boundaries
- **Data Sources**: Integrates with OpenStreetMap and Mapbox boundaries

### Custom Geographic Data

```tsx
const customGeoData: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "zone-1",
        name: "Custom Zone 1",
        postalCode: "12345"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[[lng1, lat1], [lng2, lat2], ...]]
      }
    }
  ]
};

<MapboxZoneSelector
  mapboxToken={TOKEN}
  customGeoData={customGeoData}
/>
```

## 💡 Usage Examples

### Delivery Zone Management

```tsx
function DeliveryZoneManager() {
  const [deliveryZones, setDeliveryZones] = useState<Coordinates[][]>([]);

  const handleZoneUpdate = (coordinates: Coordinates[][]) => {
    setDeliveryZones(coordinates);
    // Save to backend
    saveDeliveryZones(coordinates);
  };

  return (
    <div>
      <h2>Define Your Delivery Areas</h2>
      <MapboxZoneSelector
        mapboxToken={TOKEN}
        onCoordinatesChange={handleZoneUpdate}
        selectedColor="#27ae60"
        language="en"
        initialCenter={[-73.935242, 40.73061]} // NYC default
      />
      <div>
        <p>Selected zones: {deliveryZones.length}</p>
        <button onClick={() => console.log(deliveryZones)}>Save Delivery Zones</button>
      </div>
    </div>
  );
}
```

### Service Area Analysis with Metrics

```tsx
function ServiceAreaAnalyzer() {
  const mapRef = useRef<MapboxZoneSelectorRef>(null);
  const [totalArea, setTotalArea] = useState(0);
  const [zoneMetrics, setZoneMetrics] = useState<Record<string, ZoneMetrics>>({});

  const handleZoneSelect = (zone: Zone, metrics: ZoneMetrics) => {
    setZoneMetrics((prev) => ({ ...prev, [zone.id]: metrics }));
    setTotalArea((prev) => prev + metrics.area);
  };

  const exportAnalysis = () => {
    const data = mapRef.current?.exportSelection({
      format: "csv",
      includeMetrics: true,
      customColumns: {
        coverage_area: (zone, metrics) => metrics.area,
        service_center: (zone, metrics) => metrics.center.join(", "),
      },
    });
    downloadFile(data, "service-area-analysis.csv");
  };

  return (
    <>
      <MapboxZoneSelector
        ref={mapRef}
        mapboxToken={TOKEN}
        multiSelect={true}
        autoMerge={true}
        showMetrics={true}
        onZoneSelect={handleZoneSelect}
        constraints={{
          maxTotalArea: 500,
          minZoneArea: 1,
        }}
      />
      <div className="metrics-panel">
        <h3>Total Coverage: {totalArea.toFixed(2)} km²</h3>
        <button onClick={exportAnalysis}>Export Analysis</button>
      </div>
    </>
  );
}
```

### Delivery Zone Designer with Drawing Tools

```tsx
function DeliveryZoneDesigner() {
  const mapRef = useRef<MapboxZoneSelectorRef>(null);
  const [drawingMode, setDrawingMode] = useState<"polygon" | "circle">("polygon");

  const handleCustomZone = (geometry: any, coordinates: Coordinates[]) => {
    // Save custom zone to backend
    saveCustomDeliveryZone({
      geometry,
      coordinates,
      name: prompt("Zone name:"),
      deliveryFee: parseFloat(prompt("Delivery fee:") || "0"),
    });
  };

  return (
    <div className="zone-designer">
      <div className="toolbar">
        <button onClick={() => setDrawingMode("polygon")}>Draw Polygon</button>
        <button onClick={() => setDrawingMode("circle")}>Draw Circle</button>
        <button
          onClick={() =>
            mapRef.current?.selectWithinRadius({
              center: mapRef.current.getMapCenter(),
              radius: 5,
              unit: "kilometers",
            })
          }
        >
          Select 5km Radius
        </button>
      </div>

      <MapboxZoneSelector
        ref={mapRef}
        mapboxToken={TOKEN}
        enableDrawing={true}
        drawingMode={drawingMode}
        onCustomZoneDrawn={handleCustomZone}
        enableRadiusSelection={true}
      />
    </div>
  );
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Example Test

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MapboxZoneSelector } from "mapbox-zone-selector";

describe("MapboxZoneSelector", () => {
  it("should merge adjacent zones when selected", async () => {
    const handleCoordinatesChange = jest.fn();

    render(
      <MapboxZoneSelector mapboxToken="test-token" onCoordinatesChange={handleCoordinatesChange} autoMerge={true} />
    );

    // Click on Paris 18th district
    const zone18 = await screen.findByTestId("zone-paris-18");
    fireEvent.click(zone18);

    // Click on adjacent Paris 19th district
    const zone19 = await screen.findByTestId("zone-paris-19");
    fireEvent.click(zone19);

    // Should receive merged coordinates
    await waitFor(() => {
      expect(handleCoordinatesChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.arrayContaining([expect.arrayContaining([expect.any(Number), expect.any(Number)])]),
        ])
      );
    });
  });
});
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Dependencies

Core dependencies used by the library:

- `mapbox-gl`: Interactive map rendering
- `@turf/turf`: Geospatial operations (area, merge, distance calculations)
- `@mapbox/mapbox-gl-draw`: Drawing tools integration
- `react` & `react-dom`: UI framework
- `typescript`: Type safety

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/mapbox-zone-selector.git
cd mapbox-zone-selector

# Install dependencies
pnpm install

# Start development server (Vite)
pnpm dev

# Build library
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
mapbox-zone-selector/
├── src/
│   ├── components/
│   │   ├── MapboxZoneSelector.tsx      # Main component
│   │   ├── ZoneLayer.tsx               # Zone rendering layer
│   │   ├── SearchInput.tsx             # Postal code search
│   │   ├── DrawingTools.tsx            # Drawing controls
│   │   └── MetricsDisplay.tsx          # Area/perimeter display
│   ├── hooks/
│   │   ├── useZoneSelection.ts         # Selection logic
│   │   ├── useMergePolygons.ts         # Merging algorithm
│   │   ├── useSelectionHistory.ts      # Undo/redo functionality
│   │   └── useZoneMetrics.ts           # Area calculations
│   ├── utils/
│   │   ├── geoUtils.ts                 # Geographic calculations
│   │   ├── mergeAdjacentZones.ts       # Zone merging logic
│   │   ├── coordinateHelpers.ts        # Coordinate transformations
│   │   ├── importExport.ts             # File format handlers
│   │   └── constraints.ts              # Selection validation
│   ├── data/
│   │   ├── cityBoundaries.ts           # Global city boundary data
│   │   └── districtMappings.ts         # City-to-district mappings
│   ├── types/
│   │   └── index.ts                    # TypeScript definitions
│   └── index.ts                        # Public exports
├── tests/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🙏 Acknowledgments

- [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs) for the interactive map
- [Mapbox Boundaries](https://www.mapbox.com/boundaries) for administrative boundary data
- [Turf.js](https://turfjs.org/) for geospatial operations
- [OpenStreetMap](https://www.openstreetmap.org/) for open geographic data
- [Natural Earth](https://www.naturalearthdata.com/) for worldwide boundary data

## 📞 Support

- 📧 Email: support@mapbox-zone-selector.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/mapbox-zone-selector/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/mapbox-zone-selector/discussions)
