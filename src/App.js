import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker } from '@react-google-maps/api';
import axios from 'axios';
import { Fab } from '@material-ui/core';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import CircularProgress from '@material-ui/core/CircularProgress';
import TuneIcon from '@mui/icons-material/Tune';
import { SHOW_FILTERS_ON_LOAD } from './constants/constants';
import { INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY, SEARCH_BOX_STYLE } from "./constants/map-constants";
import { INIT_FILTER_CONFIG } from './constants/filter-constants';
import { loadWeatherForecast, getPlacesKey, convertFromMeters, loadNWSData } from './utils/utils.js';
import { checkAllFilters, filterForecastsByDate, getUniqueShortDates } from './utils/filterUtils.js';
import { getCurrentLocation, getIPLocation } from './utils/locationUtils.js';
import SliderComponent from './components/SliderComponent.js';
import InfoWindowComponent from './components/infoWindow.js';
import './styles/app.css';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [mapCenter, setMapCenter] = useState(INITIAL_MAP_CENTER);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [activity] = useState("fly a kite");
  const [locationRequested, setLocationRequested] = useState(false);
  const [showFilters, setShowFilters] = useState(SHOW_FILTERS_ON_LOAD);
  const [sliderStates, setSliderStates] = useState(
    INIT_FILTER_CONFIG.map(filter => ({
      name: filter.name,
      bounds: filter.bounds,
      units: filter.units,
      init: filter.init,
      sliderValue: [filter.init.lower, filter.init.upper],
      isEnabled: true
    }))
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let forecastsMap = new Map(); // { lat,lng } => { daily:{}, hourly:{}, location:{} }
  const [placesCounter, setPlacesCounter] = useState(0);
  const searchBoxRef = useRef(null);
  useEffect(() => {
    getIPLocation().then((ipLocation) => {
      if (ipLocation !== undefined && ipLocation !== null) {
        setMapCenter({ lat: ipLocation.lat, lng: ipLocation.lng });
        addMarker(ipLocation.lat, ipLocation.lng);
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onLoad = (ref) => {
    setMapRef(ref);
  };
  const onSearchLoad = (ref) => {
    searchBoxRef.current = ref;
  };
  const getLocation = () => {
    setLocationRequested(true);
    getCurrentLocation().then((l) => {
      if (l === undefined || l === null) {
        console.error(`getLocation: l is undefined: ${l}`);
        return;
      }
      setMapCenter({ lat: l.lat, lng: l.lng });
      const latLng = { "lat": l.lat, "lng": l.lng };
      console.log(`AAAA Location: ${JSON.stringify({ latLng })}`);
      addMarker(l.lat, l.lng);
    }).finally(() => {
      setLocationRequested(false);
    });
  };
  const handleSliderChange = (index, newValue) => {
    const updatedSliderStates = [...sliderStates];
    updatedSliderStates[index].sliderValue = newValue;
    setSliderStates(updatedSliderStates);
  };
  const onPlacesChanged = () => {
    const searchResults = searchBoxRef.current.getPlaces();
    const mapBounds = new window.google.maps.LatLngBounds();
    searchResults?.forEach(place => {
      //TODO: Save place data in forecastsMap
      console.log(`  Place: ${JSON.stringify(place)}`);
      if (place.geometry.viewport) {
        mapBounds.union(place.geometry.viewport);
      } else {
        mapBounds.extend(place.geometry.location);
      }
    });
    mapRef?.setCenter(mapBounds.getCenter());
    onMapClick({ latLng: mapBounds.getCenter() });
  };
  const getGridXY = (marker) => {
    const nws_weather_url = `https://api.weather.gov/points/${marker.placeKey}`;
    axios.get(nws_weather_url)
      .then(response => {
        const nwsData = response.data;
        const location = loadNWSData(nwsData);
        addToForecastsMap(marker.placeKey, "location", { ...location });
        return [location.forecastOffice, location.gridX, location.gridY];
      }).then((args) => {
        const [forecastOffice, gridX, gridY] = args;
        getWeatherData(marker.placeKey, "hourly", forecastOffice, gridX, gridY);
        getWeatherData(marker.placeKey, "daily", forecastOffice, gridX, gridY);
      }).catch(e => {
        console.error(`ERROR getGridXY: ${e} , ${JSON.stringify(e)}`);
      })
  };
  //Save Data in forecastsMap
  const addToForecastsMap = (placeKey, jsonKey, jsonValue) => {
    let place = [];
    if (forecastsMap.has(placeKey)) {
      place = forecastsMap.get(placeKey);
    } else {
      forecastsMap.set(placeKey, place);
    }
    switch (jsonKey) {
      case 'hourly':
        if (!place.hourly) {
          place.hourly = [jsonValue];
        } else { place.hourly = [...place, jsonValue] }
        break;
      case 'daily':
        if (!place.daily) {
          place.daily = [jsonValue];
        } else { place.daily = [...place, jsonValue] }
        break;
      case 'geocode':
      case 'location':
        if (!place[jsonKey]) {
          place[jsonKey] = { ...jsonValue };
        } else {
          place[jsonKey] = { ...place[jsonKey], ...jsonValue };
        }
        break;
      default:
        console.error(`Unknown jsonKey, skipping: ${JSON.stringify(jsonKey)} ${JSON.stringify(jsonValue)}`);
    }

  };
  //Read Hourly NWS Weather Data
  const getWeatherData = (placeKey, timePeriod, forecastOffice, gridX, gridY) => {
    const nws_forecast_url = `https://api.weather.gov/gridpoints/${forecastOffice}/${gridX},${gridY}/forecast/`
      + (timePeriod === 'hourly' ? `hourly` : ``);
    axios.get(nws_forecast_url)
      .then(response => {
        let [elevation, elevationUnit] = convertFromMeters(
          response.data.properties.elevation.value,
          response.data.properties.elevation.unitCode);
        addToForecastsMap(placeKey, "location", { elevation, elevationUnit });
        let data = [], count = response.data.properties.periods.length;
        for (let i = 0; i < count - 1; i++) {
          const weatherData = loadWeatherForecast(response.data.properties.periods[i]);
          data.push(weatherData);
        };
        return data;
      }).then((data) => {
        addToForecastsMap(placeKey, timePeriod, { ...data });
      }).catch(e => {
        console.error(`ERROR: ${e} , ${JSON.stringify(e)}`);
      })
  };
  //Place Marker on Map, start fetching data
  const onMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    addMarker(lat, lng, e.pixel);
  };
  const addMarker = useCallback((lat, lng, pixel = null) => {
    if (lat === undefined || lng === undefined) {
      console.error(`addMarker: lat or lng is undefined: ${lat}, ${lng}`);
      return;
    }
    const placeKey = getPlacesKey(lat, lng);
    console.log(`CCCC Location: ${lat}, ${lng}`);
    const newMarker = {
      id: new Date().toISOString(),
      position: { lat: lat, lng: lng },
      placeKey: getPlacesKey(lat, lng),
      pixel: pixel,
      placeIndex: placesCounter
    };
    setMarkers(currentMarkers => [...currentMarkers, { ...newMarker }]);
    setPlacesCounter(placesCounter => placesCounter + 1);
    forecastsMap.set(placeKey, newMarker);
    getGridXY(newMarker);
    getGeocodeData(lat, lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function getGeocodeData(lat, lng) {
    if (lat === undefined || lng === undefined) {
      console.error(`getGeocodeData: lat or lng is undefined: ${lat}, ${lng}`);
      return;
    }
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/text',
        'Origin': 'http://perfecttimeto.com'
      },
    });
    if (!response) {
      console.error(`HTTP error when reading geocode data: status: ${response.status}`);
    }
    const data = await response.json();
    const formattedData = {
      fullAddress: data.display_name,
      zip: data.address.postcode || data.address.zipcode || data.address.postalcode || data.address.postal_code,
      neighbourhood: data.address.neighbourhood || data.address.village || data.address.hamlet || data.address.suburb,
      city: data.address.city || data.address.town,
      state: data.address.state || data.address.county || data.address.region,
      country: data.address.country || data.address.country_code,
      streetName: data.address.road || data.address.pedestrian || data.address.footway || data.address.path || data.address.cycleway,
      locationName: data.name || data[data.type] || data.address.road || data.address.neighbourhood || data.address.village || data.address.hamlet || data.address.suburb || data.address.city || data.address.town || data.address.county || data.address.state || data.address.country,
      placeClass: data.class,
      placeType: data.type,
    };
    addToForecastsMap(getPlacesKey(lat, lng), "geocode", { ...formattedData });
  }
  //Show InfoWindow, populate with data
  const onMarkerClick = useCallback((marker) => {
    marker['dateIndex'] = 0;
    let place = forecastsMap.get(marker['placeKey']);
    if (!place || place === undefined || place['daily'] === undefined) {
      return;
    }
    marker['uniqueDates'] = getUniqueShortDates(place['daily']);
    marker['location'] = place["location"];
    marker['geocode'] = place["geocode"];
    marker['daily'] = place["daily"];
    marker['hourly'] = place["hourly"];
    const markerDateStr = marker['uniqueDates'][marker['dateIndex']];
    marker['markerDate'] = markerDateStr;
    marker['current'] = filterForecastsByDate(marker["daily"], markerDateStr)[0]; //0 for daytime, update to get based on hour
    const failedFilters = checkAllFilters(marker['current'], sliderStates);
    marker['failedFilters'] = failedFilters;
    marker['failedStr'] = failedFilters ? failedFilters.join(', ') : '';
    marker['allSuccess'] = (failedFilters.length === 0);
    // marker['hourlies'] = filterForecastsByDate(marker["hourly"], markerDateStr);
    marker['num_dailies'] = marker['uniqueDates'].length;
    setSelectedMarker(marker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);
  const navigateDailyForecast = (direction) => {
    const newIndex = selectedMarker.dateIndex + direction;
    if (newIndex >= 0 && newIndex < selectedMarker.num_dailies) {
      const markerDateStr = selectedMarker['uniqueDates'][newIndex];
      const current = filterForecastsByDate(selectedMarker["daily"], markerDateStr)[0];
      const failedFilters = checkAllFilters(current, sliderStates);
      setSelectedMarker({
        ...selectedMarker,
        dateIndex: newIndex,
        current: current,
        allSuccess: (failedFilters.length === 0),
        failedStr: failedFilters ? failedFilters.join(', ') : '',
        failedFilters: failedFilters,
        markerDate: markerDateStr,
      });
    }
  };
  const toggleFilterPanel = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="App">
      <header className="App-header" id="header">
        <div className="header-content">
          <h1 className="title">PerfectTimeTo</h1>
          <select className="dropdown" onChange={() => window.location.reload()}>
            <option>{activity}</option>
          </select>
          <TuneIcon
            alt="Filter Icon"
            className="filter-icon"
            onClick={toggleFilterPanel}
          />
        </div>
      </header>
      <main className="main-content">
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={PLACES_LIBRARY}
        >
          {{ mapRef } ? (
            <div className="GoogleMapContainer">
              <GoogleMap content="width=device-width, user-scalable=no"
                mapContainerStyle={MAP_CONTAINER_STYLE}
                // mapStyle={MAP_PARKS_STYLE}
                options={INITIAL_MAP_OPTIONS}
                // mapTypeId={DEFAULT_MAP_TYPE}
                // clickableIcons={false}
                // gestureHandling='greedy'
                center={mapCenter}
                zoom={DEFAULT_ZOOM_LEVEL}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                tilt={(45)}
                // scrollwheel={false}
                featureType={"parks"}
              >
                <div>
                  <StandaloneSearchBox
                    onLoad={onSearchLoad}
                    onPlacesChanged={onPlacesChanged}
                    bounds={mapRef ? mapRef.getBounds() : null}
                    defaultCenter={mapCenter}>
                    <input
                      id={"searchbox-text"}
                      type="text"
                      placeholder="Search places..."
                      style={SEARCH_BOX_STYLE} />
                  </StandaloneSearchBox>
                  <Fab className='location-button'
                    color={locationRequested ? 'inherit' : 'primary'}
                    size="small"
                    onClick={getLocation}>
                    <LocationOnIcon />
                  </Fab>
                </div>
                {markers.map(marker => (
                  <Marker
                    key={marker.id}
                    position={marker.position}
                    onClick={() => onMarkerClick(marker)}
                  />
                ))}
                {selectedMarker && (
                  <InfoWindowComponent
                    selectedMarker={selectedMarker}
                    navigateDailyForecast={navigateDailyForecast}
                    setSelectedMarker={setSelectedMarker}
                    setMarkers={setMarkers}
                    activity={activity}
                  />
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="loading-screen">
              <CircularProgress
                color="secondary"
                size="100px"
              />
              <h2>loading...</h2>
            </div>
          )}
        </LoadScript>
      </main>
      {showFilters && (
        <div className="filters-panel">
          {sliderStates.map((slider, index) => {
            return <SliderComponent
              key={index}
              index={index}
              slider={slider}
              onSliderChange={handleSliderChange} />;
          })}
        </div>
      )}
    </div>
  );
}

export default App;
