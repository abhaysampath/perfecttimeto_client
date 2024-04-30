import './App.css';
import { useState, useRef } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, INITIAL_MAP_CENTER, PLACES_LIBRARY } from './constants';
import { SEARCH_BOX_STYLE, MAP_CONTAINER_STYLE, CUSTOM_MAP_STYLE } from './styles';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [activity, setActivity] = useState("fly a kite");
  const searchBoxRef = useRef(null);
  const onLoad = (ref) => {
    setMapRef(ref);
  };
  const onSearchLoad = (ref) => {
    searchBoxRef.current = ref;
  };
  const onPlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    const bounds = new window.google.maps.LatLngBounds();

    places.forEach(place => {
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    mapRef.fitBounds(bounds);
  };

  return (
    <div className="App">
      <header className="App-header">
        PerfectTimeTo... {activity}!
      </header>
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={PLACES_LIBRARY}
      >
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        style={CUSTOM_MAP_STYLE}
        center={INITIAL_MAP_CENTER}
        zoom={DEFAULT_ZOOM_LEVEL}
        onLoad={onLoad}
      >
      <div>
        <StandaloneSearchBox
          onLoad={onSearchLoad}
          onPlacesChanged={onPlacesChanged}>
        <input
            type="text"
            placeholder="Search places..."
            style={SEARCH_BOX_STYLE}/>
          </StandaloneSearchBox>
      </div>
        {/* Add Markers, Map components */}
      </GoogleMap>
    </LoadScript>

    </div>
  );
}

export default App;
