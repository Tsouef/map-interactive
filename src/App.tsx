import { useState, useRef } from 'react'
import { LeafletZoneSelector } from './components/LeafletZoneSelector'
import type { LeafletZoneSelectorRef } from './components/LeafletZoneSelector/types'
import type { Zone } from './types'
import './App.css'

function App() {
  const mapRef = useRef<LeafletZoneSelectorRef>(null)
  const [selectedZones, setSelectedZones] = useState<Zone[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const handleSelectionChange = (zones: Zone[]) => {
    setSelectedZones(zones)
    console.log('Selected zones:', zones)
  }

  const handleExport = () => {
    if (mapRef.current) {
      const geoJson = mapRef.current.exportSelection('geojson')
      console.log('Exported GeoJSON:', geoJson)
      
      // Download as file
      const blob = new Blob([geoJson as string], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-zones.geojson'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleClearSelection = () => {
    if (mapRef.current) {
      mapRef.current.clearSelection()
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Leaflet Zone Selector Demo</h1>
        <div className="controls">
          <button onClick={toggleTheme}>
            Toggle Theme ({theme})
          </button>
          <button onClick={handleClearSelection} disabled={selectedZones.length === 0}>
            Clear Selection
          </button>
          <button onClick={handleExport} disabled={selectedZones.length === 0}>
            Export GeoJSON
          </button>
          <span className="zone-count">
            {selectedZones.length} zone{selectedZones.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      </header>
      
      <main className="app-main">
        <LeafletZoneSelector
          ref={mapRef}
          theme={theme}
          initialCenter={[48.8566, 2.3522]} // Paris
          initialZoom={12}
          enableSearch={true}
          enableDrawing={false}
          multiSelect={true}
          onSelectionChange={handleSelectionChange}
          onError={(error) => console.error('Map error:', error)}
        />
      </main>
      
      <aside className="app-sidebar">
        <h2>Selected Zones</h2>
        {selectedZones.length === 0 ? (
          <p className="empty-state">Click on the map to select zones</p>
        ) : (
          <ul className="zone-list">
            {selectedZones.map(zone => (
              <li key={zone.id}>
                <strong>{zone.name}</strong>
                {zone.properties?.population && (
                  <span className="zone-detail">
                    Pop: {zone.properties.population.toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

export default App