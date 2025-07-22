import { useState, useRef } from 'react';
import "./App.css";
import { MapboxZoneSelector } from "./components/MapboxZoneSelector";
import type { Zone, MapboxZoneSelectorRef } from "./types";

function App() {
  const [selectedZones, setSelectedZones] = useState<Zone[]>([]);
  const mapRef = useRef<MapboxZoneSelectorRef>(null);

  const handleSelectionChange = (zones: Zone[]) => {
    setSelectedZones(zones);
    console.log('Selected zones:', zones);
  };

  const handleZoneClick = (zone: Zone) => {
    console.log('Clicked zone:', zone.name);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapboxZoneSelector
        ref={mapRef}
        mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialCenter={[2.3522, 48.8566]}
        initialZoom={12}
        mapStyle="mapbox://styles/mapbox/light-v11"
        multiSelect={true}
        maxSelections={10}
        onSelectionChange={handleSelectionChange}
        onZoneClick={handleZoneClick}
        theme="light"
      />
      
      {/* Selection Info Panel */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'white',
        padding: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        maxWidth: 300,
        maxHeight: 400,
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Zone Selection Demo</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#666' }}>
          Click on the map to create zones. Click on a zone to toggle selection.
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>
          <strong>Selected Zones:</strong> {selectedZones.length} / 10
        </p>
        
        {selectedZones.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Selected:</h4>
            <div style={{ fontSize: 12 }}>
              {selectedZones.map(zone => (
                <div key={zone.id} style={{
                  padding: '4px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  {zone.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={() => mapRef.current?.clearSelection()}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}

export default App;