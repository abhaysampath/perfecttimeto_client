import './styles/app.css';
import './styles/loading-screen.css';
import { useState, useCallback, useEffect } from "react";  // useRef
import { GoogleMap, LoadScript } from '@react-google-maps/api';  // StandaloneSearchBox, 
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY } from './constants';
import { SEARCH_BOX_STYLE, MAP_CONTAINER_STYLE, CUSTOM_MAP_STYLE } from './styles';
import { INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_PARKS_STYLE } from "./styles/map-styles";
import { IconsComponent } from './IconsComponent';
import { LoadingScreen } from './LoadingScreen';
const google = window.google;
// import { loadMap, addPlace, removePlace } from './MarkerManager';

function App() {
  // // const [map, setMap, getMap] = useState(null);
  const [map, setMap] = useState(null);
  // // const [mapRef, setMapRef, getMapRef] = useState(null);
  const [markers, setMarkers, getMarkers] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activity, setActivity] = useState("fly a kite");
  // // const [nearbyParks, setNearbyParks] = useState<PlaceData[] | null>(null);
  // // const searchBoxRef = useRef(null);

  useEffect(() => {
    loadMap();
  }, []);
  const loadMap = () => {
    // if ({map} && {mapLoaded}) {
    //   console.warn('  Map already loaded, returning.');
    //   return;
    // }
    console.warn('  loadMap.');
    const newMap = new google.maps.Map(document.getElementById('map'), INITIAL_MAP_OPTIONS);
    console.warn('  created newMap.');
    setMap(newMap);
    console.warn('  set newMap.');
    setMapLoaded(true);
    console.warn('  setMapLoaded.');
    newMap.setOptions({ styles: { MAP_PARKS_STYLE } });
    console.warn('  setOptions.');
  }
  // loadMap(() => setMapLoaded(true)); //getMap()));
  // // const onLoad = useCallback((map) => {
  // //   const newMap = new window.google.maps.Map(document.getElementById('map'), INITIAL_MAP_OPTIONS);
  // //   setMap(newMap);
  // //   setMapLoaded(true);
  // //   newMap.setOptions({ styles: MAP_PARKS_STYLE });
  // //   // const bounds = new window.google.maps.LatLngBounds(INITIAL_MAP_CENTER);
  // //   // map.fitBounds(bounds);
  // // }, []);
  // setMarkers([]);
  // setMap(new window.google.maps.Map(document.getElementById('map'), INITIAL_MAP_OPTIONS));

  // if (callback) callback();
  // // // const onLoad = useCallback(function callback(map) {
  // // //   setMap(map);
  // // const onLoad = (ref) => {
  // //   setMapRef(ref);
  // //   const bounds = new window.google.maps.LatLngBounds(INITIAL_MAP_CENTER);
  // //   map.fitBounds(bounds);
  // // };
  // // }, []);

  const onUnmount = useCallback(() => { // function callback(map) {
    setMap(null);
  }, []);

  const onMapClick = useCallback((e) => {
    const newMarker = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarkers(current => [...current, newMarker]);
  }, []);

  // const onSearchBoxLoad = useCallback(ref => {
  //   searchBoxRef.current = ref;
  // }, []);
  // const onPlacesChanged = () => {
  //   const places = searchBoxRef.current.getPlaces();
  //   const bounds = new window.google.maps.LatLngBounds();
  //   places.forEach(place => {
  //     if (place.geometry.viewport) {
  //       bounds.union(place.geometry.viewport);
  //     } else {
  //       bounds.extend(place.geometry.location);
  //     }
  //   });
  //   mapRef.fitBounds(bounds);
  // };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1 className="title">PerfectTimeTo</h1>
          <select className="dropdown" onChange={() => window.location.reload()}>
            <option>Fly a kite</option>
          </select>
        </div>
      </header>
      <main >
        {!mapLoaded ? (
          <LoadingScreen />
        ) : (
          <div id="map" style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
            <LoadScript
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              libraries={PLACES_LIBRARY}
              onLoad={setMapLoaded(true)}
            >
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                style={MAP_PARKS_STYLE}
                mapOptions={INITIAL_MAP_OPTIONS}
                center={INITIAL_MAP_CENTER}
                zoom={DEFAULT_ZOOM_LEVEL}
                // onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
              />
            </LoadScript>
          </div>
        )}
      </main>
      {/* 
             <div id="map" style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
               <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                style={MAP_PARKS_STYLE}
                mapOptions={INITIAL_MAP_OPTIONS}
                center={INITIAL_MAP_CENTER}
                zoom={DEFAULT_ZOOM_LEVEL}
                // onLoad={onLoad}
                onLoad={() => {}}
                onUnmount={onUnmount}
                onClick={onMapClick} />
                <div>
                  <StandaloneSearchBox
                    onLoad={onSearchBoxLoad}
                  // onPlacesChanged={onPlacesChanged}
                  >
                    <input
                      type="text"
                      placeholder="Search places..."
                      style={SEARCH_BOX_STYLE} />
                  </StandaloneSearchBox>
                </div>
              </GoogleMap>
             </div>
          )}
        </LoadScript>
      */}
      <footer className="footer">
        <IconsComponent />
      </footer>
    </div >
  );
}

export default App;
