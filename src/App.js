import './styles/app.css';
import { useState, useRef, useCallback } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { SHOW_FILTERS_ON_LOAD } from './constants/constants';
import { INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY } from "./constants/map-constants";
import TuneIcon from '@mui/icons-material/Tune';
// import { sendMessageIcon } from '@mui/icons-material/ScheduleSend';
import { loadWeatherForecast, getPlacesKey, convertFromMeters, loadNWSData } from './utils/utils.js';
import { SEARCH_BOX_STYLE } from "./constants/map-constants";
import { INIT_FILTER_CONFIG } from './constants/filter-constants';
import axios from 'axios';
import SliderComponent from './components/SliderComponent.js';
import { getUniqueShortDates, checkAllFilters } from './utils/filterUtils.js';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [activity] = useState("fly a kite");
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const searchBoxRef = useRef(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let forecastsMap = new Map(); // { lat,lng } => { daily:{}, hourly:{}, location:{} }
  const [placesCounter, setPlacesCounter] = useState(0);
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
  const handleSliderChange = (index, newValue) => {
    const updatedSliderStates = [...sliderStates];
    updatedSliderStates[index].sliderValue = newValue;
    setSliderStates(updatedSliderStates);
  };
  const onLoad = (ref) => {
    setMapRef(ref);
  };
  const onSearchLoad = (ref) => {
    searchBoxRef.current = ref;
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
        // Update to read from https://api.weather.gov/gridpoints/OKX/33,35
        // getWeatherData(placeKey, "detail", forecastOffice, gridX, gridY);
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
  const onMapClick = useCallback((e) => {
    const placeKey = getPlacesKey(e.latLng.lat(), e.latLng.lng());
    const newMarker = {
      id: new Date().toISOString(),
      position: e.latLng.toJSON(),
      placeKey: getPlacesKey(e.latLng.lat(), e.latLng.lng()),
      pixel: e.pixel,
      placeIndex: placesCounter
    };
    setMarkers(currentMarkers => [...currentMarkers, { ...newMarker }]);
    setPlacesCounter(placesCounter => placesCounter + 1);
    forecastsMap.set(placeKey, newMarker);
    getGridXY(newMarker);
    getGeocodeData(e.latLng.lat(), e.latLng.lng());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function getGeocodeData(lat, lng) {
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
      zip: data.address.postcode,
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
  const filterForecastsByDate = (forecasts, markerDateStr) => {
    let filteredForecasts = [];
    forecasts?.forEach((val) => {
      Object.values(val).forEach((value, key) => {
        if (value["shortDate"] === markerDateStr) {
          filteredForecasts = [...filteredForecasts, value]
        }
      })
    });
    return filteredForecasts;
  };

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
  const removeMarker = useCallback((id) => {
    setMarkers((markers) => markers.filter(m => m.id !== id));
    setSelectedMarker(null);
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
                center={INITIAL_MAP_CENTER}
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
                    defaultCenter={INITIAL_MAP_CENTER}>
                    <input
                      id={"searchbox-text"}
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
                    id={selectedMarker.position}
                    position={selectedMarker.position}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="info-window">
                      <div className='info-window-time-select'>
                        <button className="nav-button" onClick={() => navigateDailyForecast(-1)} disabled={selectedMarker.dateIndex === 0}>
                          {"<<  "}</button>
                        {selectedMarker.current &&
                          <h4>{selectedMarker.current.dateStr} ( {selectedMarker.dateIndex + 1} / {selectedMarker.num_dailies} )</h4>
                        }
                        <button className="nav-button" onClick={() => navigateDailyForecast(1)} disabled={!selectedMarker.current || (selectedMarker.dateIndex + 1 === selectedMarker.num_dailies)}>
                          {"  >>"}</button>
                      </div>
                      <h3 className="info-window-title">
                        {selectedMarker.current.timePeriod}: {selectedMarker.current.desc}</h3>
                      {selectedMarker.geocode && <h4 className='info-window-location'>
                        {selectedMarker.geocode.locationName} - {selectedMarker.geocode.neighbourhood}, {selectedMarker.geocode.city}, {selectedMarker.geocode.state}
                      </h4>}
                      <div className="info-window-body">
                        <img className="info-window-image" src={selectedMarker.current.weatherIcon} alt={selectedMarker.current.desc} />
                        <p className="info-window-desc">{selectedMarker.current.fullDesc}</p>
                      </div>
                      <div>
                        <ul className="info-window-list">
                          <table padding="0" className="info-window-content">
                            <tbody>
                              <tr>
                                <td>Wind Speed:</td>
                                <td>{selectedMarker.current.windSpeed} ({selectedMarker.current.windDirection})</td>
                              </tr>
                              {selectedMarker.current.temp && <tr>
                                <td>Temperature:</td>
                                <td>{selectedMarker.current.temp} °{selectedMarker.current.tempUnit} {selectedMarker.current.trend ? `(${selectedMarker.current.trend})` : ``}</td>
                              </tr>}
                              {selectedMarker.current.precipitation && <tr>
                                <td>Precipitation:</td>
                                <td>{selectedMarker.current.precipitation} {selectedMarker.current.precipitationUnit}</td>
                              </tr>}
                              {selectedMarker.current.relativeHumidity && <tr>
                                <td>Humidity: </td>
                                <td>{selectedMarker.current.relativeHumidity} {selectedMarker.current.relativeHumidityUnit}</td>
                              </tr>}
                              {selectedMarker.location.elevation && <tr>
                                <td>Elevation: </td>
                                <td>{selectedMarker.location.elevation} {selectedMarker.location.elevationUnit}</td>
                              </tr>}
                            </tbody>
                          </table>
                        </ul>
                      </div>
                      <div className="info-window-status">
                        {(() => {
                          const allSuccess = selectedMarker.allSucces || selectedMarker.failedStr === '';
                          const failedStr = selectedMarker.failedStr;
                          const messageStyle = {
                            background: allSuccess ? 'lightgreen' : 'lightcoral',
                            color: allSuccess ? 'darkgreen' : 'black',
                            fontSize: failedStr.length > 9 ? '80%' : '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '3px',
                            paddingLeft: '5px',
                          };
                          return (
                            <div style={messageStyle}>
                              {allSuccess ? "PerfectTimeTo " + activity : `${selectedMarker.failedStr}`}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="info-window-remove">
                        <button className="remove-button" onClick={() => removeMarker(selectedMarker.id)}>Remove</button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          ) : (
            <h1>Loading...</h1>
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
