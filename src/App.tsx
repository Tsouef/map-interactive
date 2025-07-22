import "./App.css";
import { MapboxZoneSelector } from "./components/MapboxZoneSelector";

function App() {
  return (
    <>
      <MapboxZoneSelector
        mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialCenter={[2.3522, 48.8566]}
        initialZoom={10}
        mapStyle="mapbox://styles/mapbox/light-v11"
        multiSelect={true}
      />
    </>
  );
}

export default App;
