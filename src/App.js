import './styles/app.css';
import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY } from './constants';
import { INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, MAP_PARKS_STYLE } from "./styles/map-styles";
import { IconsComponent } from './IconsComponent';
import { SEARCH_BOX_STYLE } from './styles';
import { LoadingScreen } from './LoadingScreen';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [activity, setActivity] = useState("fly a kite");
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const searchBoxRef = useRef(null);
  let placesMap = new Map();
  const [placesCounter, setPlacesCounter] = useState(0);

  const onLoad = (ref) => {
    setMapRef(ref);
    placesMap = new Map();
  };
  const onSearchLoad = (ref) => {
    searchBoxRef.current = ref;
  };
  const onPlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    const bounds = new window.google.maps.LatLngBounds();

    places?.forEach(place => {
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    mapRef.fitBounds(bounds);
  };
  useEffect(() => {
    console.log('An element was added to the map:', placesCounter);
  }, [placesCounter, placesMap]);
  const onMapClick = useCallback((e) => {
    const newMarker = {
      id: new Date().toISOString(),
      position: e.latLng.toJSON(),
    };
    setMarkers((markers) => [...markers, newMarker]);
    placesMap.set(newMarker.position, newMarker);
    setPlacesCounter(placesCounter => placesCounter + 1);
    // console.log(' placesMap:', [...placesMap.keys()]);
  }, []);
  const onMarkerClick = useCallback((marker) => {
    setSelectedMarker(marker);
  }, []);
  const removeMarker = useCallback((id) => {
    setMarkers((markers) => markers.filter(m => m.id !== id));
    setSelectedMarker(null);
  }, []);
  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1 className="title">PerfectTimeTo</h1>
          <select className="dropdown" onChange={() => window.location.reload()}>
            <option>{activity}</option>
          </select>
        </div>
      </header>
      <main className="main-content">
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={PLACES_LIBRARY}
        >
          {!{ mapRef } ? (
            <LoadingScreen />
          ) : (
            <div className="GoogleMapContainer">
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                style={MAP_PARKS_STYLE}
                mapOptions={INITIAL_MAP_OPTIONS}
                center={INITIAL_MAP_CENTER}
                zoom={DEFAULT_ZOOM_LEVEL}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
              >
                <div>
                  <StandaloneSearchBox
                    onLoad={onSearchLoad}
                    onPlacesChanged={onPlacesChanged}>
                    <input
                      type="text"
                      placeholder="Search places..."
                      style={SEARCH_BOX_STYLE} />
                  </StandaloneSearchBox>
                </div>
                {markers.map(marker => (
                  <Marker
                    key={marker.id}
                    position={marker.position}
                    onClick={() => onMarkerClick(marker)}
                  />
                ))}
                {selectedMarker && (
                  <InfoWindow
                    position={selectedMarker.position}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <div>Activity: {activity}</div>
                      <button onClick={() => removeMarker(selectedMarker.id)} style={{ color: 'blue', textDecoration: 'underline' }}>
                        Remove
                      </button>
                      <button onClick={() => setSelectedMarker(null)} style={{ float: 'right' }}>X</button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          )}
        </LoadScript>
      </main>
      <footer className="App-footer">
        <IconsComponent />
      </footer>
    </div>
  );
}

export default App;
