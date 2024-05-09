import './styles/app.css';
import { useState, useRef, useCallback } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY, WEATHER_PERIOD_LIMIT } from './constants';
import { DEFAULT_MAP_TYPE, INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, MAP_PARKS_STYLE } from "./styles/map-styles";
import TuneIcon from '@mui/icons-material/Tune';
// import { sendMessageIcon } from '@mui/icons-material/ScheduleSend';
import { loadWeatherForecast, getDateKey, getPlacesKey } from './utils';
import { SEARCH_BOX_STYLE } from './styles';
import { LoadingScreen } from './LoadingScreen';
import { INIT_FILTER_CONFIG } from './filtersConfig';
import { FiltersPanel } from './FiltersPanel';
import axios from 'axios';
// import { checkValidTimeOfDay, checkTemperature, checkWindSpeed, checkPrecipitation } from './Filters';
import { checkValidTimeOfDay } from './Filters';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [activity, setActivity] = useState("fly a kite");
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const searchBoxRef = useRef(null);
  let placesMap = new Map();
  const [placesCounter, setPlacesCounter] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

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
      if (place.geometry.viewport) {
        mapBounds.union(place.geometry.viewport);
      } else {
        mapBounds.extend(place.geometry.location);
      }
    });
    mapRef?.fitBounds(mapBounds);
  };
  const updatePlacesMap = (placesMap, placesKey, mapKey, mapValue) => {
    if (!placesMap.has(placesKey)) {
      console.warn(`  WTF?? ${placesKey}`);
      return;
    }
    const existingEntry = placesMap.get(placesKey);
    placesMap.set(placesKey, {
      ...existingEntry,
      [mapKey]: mapValue,
    });
  };
  const onMapClick = useCallback((e) => {
    //Move this to a separate method that can be called for nearby places
    const newMarker = {
      id: new Date().toISOString(),
      position: e.latLng.toJSON(),
      key: `${e.latLng.lat()},${e.latLng.lng()}`
    };
    setMarkers((markers) => [...markers, newMarker]);
    setPlacesCounter((placesCounter) => placesCounter + 1);
    placesMap.set(newMarker.key, newMarker);
    getGridXY(newMarker.position);
  }, []);
  const getGridXY = (position) => {
    const lat = position.lat;
    const lng = position.lng;
    const nws_weather_url = `https://api.weather.gov/points/${lat},${lng}`;
    axios.get(nws_weather_url)
      .then(response => {
        const nws_data = response.data;
        const gridX = nws_data.properties.gridX;
        const gridY = nws_data.properties.gridY;
        const forecast_office = nws_data.properties.cwa;
        const placesKey = getPlacesKey(position.lat, position.lng);
        addGridToPlacesMap(placesKey, gridX, gridY, forecast_office);
      }).catch(error => {
        console.error('Error fetching NWS data:', error);
      });
  };
  const addGridToPlacesMap = (key, gridX, gridY, forecast_office) => {
    if (placesMap.has(key)) {
      const existingEntry = placesMap.get(key);
      placesMap.set(key, {
        ...existingEntry,
        gridX: gridX,
        gridY: gridY,
        forecast_office: forecast_office
      });
      console.log(`      Updated entry in placesMap for ${key} -> ${JSON.stringify(placesMap)}`);
    } else {
      console.log(`      Entry not found in placesMap for ${key}`);
    }
    getDayWeatherData(key, forecast_office, gridX, gridY);
    getHourlyWeatherData(key, forecast_office, gridX, gridY);
  };
  const getDayWeatherData = (key, forecast_office, gridX, gridY) => {
    const nws_forecast_url =
      `https://api.weather.gov/gridpoints/${forecast_office}/${gridX},${gridY}/forecast`
    console.log(`  Calling URL: ${nws_forecast_url}`);
    axios.get(nws_forecast_url)
      .then(response => {
        const forecast_response = response.data;
        updatePlacesMap(placesMap, key, "elevation", Math.floor(3.28084 * forecast_response.properties.elevation.value));
        updatePlacesMap(placesMap, key, "elevationUnit", "ft");
        const periods = forecast_response.properties.periods;
        periods.forEach((period) => {
          const dateKey = getDateKey(period.startTime, period.isDaytime);
          addDailyForecastToPlaces(key, dateKey, period);
        });
      });
  };
  const getHourlyWeatherData = (key, forecast_office, gridX, gridY) => {
    const nws_forecast_url =
      `https://api.weather.gov/gridpoints/${forecast_office}/${gridX},${gridY}/forecast/hourly`
    console.log(`  Calling URL: ${nws_forecast_url}`);
    axios.get(nws_forecast_url)
      .then(response => {
        const forecast_response = response.data;
        const periods = forecast_response.properties.periods;
        periods.forEach((period) => {
          addHourlyForecastToPlaces(key, period.startTime, period);
        });
        if (!placesMap.get(key).forecast || placesMap.get(key).forecast.length === 0) {
          //Add info for InfoWindow frame, move forecasts to window
          addHourlyForecastToPlaces(key, periods[0].startTime, periods[0]);
        };
      });
  };

  const addDailyForecastToPlaces = (placesKey, dateKey, newDaily) => {
    const existingEntry = placesMap.get(placesKey);
    let existingDailies = existingEntry.daily || [];
    existingDailies.push(loadWeatherForecast(newDaily));
    placesMap.set(placesKey, {
      ...existingEntry,
      daily: existingDailies
    });
  };

  const addHourlyForecastToPlaces = (key, startTime, newForecast) => {
    if (!placesMap.has(key)) {
      console.warn(`  WTF?? ${newForecast}`);
      return;
    }
    const existingEntry = placesMap.get(key);
    let existingForecasts = existingEntry.forecast || [];
    existingForecasts.push(loadWeatherForecast(newForecast));
    placesMap.set(key, {
      ...existingEntry,
      forecast: existingForecasts
    });
  };

  //Add Marker
  const onMarkerClick = useCallback((marker) => {
    console.log(`  Marker Click: ${JSON.stringify(marker)}`);
    console.log(`  Marker Key: ${JSON.stringify(marker.key)}`);
    const placesEntry = placesMap.get(marker.key);

    if (!placesEntry || !placesEntry.forecast) {
      console.info("Place not yet loaded, return doing nothing.");
      return;
    }
    marker['forecast'] = placesEntry.forecast;
    marker['daily'] = placesEntry.daily;
    marker['elevation'] = placesEntry['elevation'];
    marker['elevationUnit'] = placesEntry['elevationUnit'];
    marker['isDaytime'] = placesEntry.isDaytime;
    marker['num_forecasts'] = placesEntry.forecast.length;
    const current = placesEntry.forecast[0];
    const currentDaily = placesEntry.daily[0];
    current['fullDesc'] = currentDaily.fullDesc;
    current['timePeriod'] = currentDaily.timePeriod;
    marker['current'] = current;
    marker['index'] = 1;
      // TODO: Add summary panel with location data, and days/hours to scroll through
    setSelectedMarker(marker);
  }, []);
  const removeMarker = useCallback((id) => {
    setMarkers((markers) => markers.filter(m => m.id !== id));
    setSelectedMarker(null);
  }, []);
  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);
  const navigateForecast = (direction) => {
    if (!selectedMarker || !selectedMarker.index) return;
    const newIndex = selectedMarker.index + direction;
    if (newIndex >= 0 && newIndex <= selectedMarker.forecast.length) {
      const current = selectedMarker.forecast[newIndex - 1];
      const currentDaily = selectedMarker.daily.filter(d => d.dateKey === current.dateKey ||
        (d.startTime <= current.endTime && d.endTime >= current.startTime));
      current.fullDesc = currentDaily.fullDesc;
      current['timePeriod'] = currentDaily['timePeriod'];
      setSelectedMarker({
        ...selectedMarker,
        current: current,
        index: newIndex
      });
    }
  };
  const toggleFilterPanel = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="App">
      <header className="App-header">
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
          {!{ mapRef } ? (
            <LoadingScreen />
          ) : (
            <div className="GoogleMapContainer">
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                mapType={DEFAULT_MAP_TYPE}
                style={MAP_PARKS_STYLE}
                mapOptions={INITIAL_MAP_OPTIONS}
                center={INITIAL_MAP_CENTER}
                zoom={DEFAULT_ZOOM_LEVEL}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                clickableIcons={false}
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
                    <div className="info-window" >
                      <div className='info-window-time-select'>
                        <button className="nav-button" onClick={() => navigateForecast(-1)} disabled={selectedMarker.index === 1}>
                          {"<<  "}</button>
                        <h4 className="info-window-title">
                          {selectedMarker.current.dateStr}  {selectedMarker.current.timeRangeStr}   ( {selectedMarker.index} / {selectedMarker.num_forecasts} )</h4>
                        <button className="nav-button" onClick={() => navigateForecast(1)} disabled={selectedMarker.index === selectedMarker.forecast.length}>
                          {"  >>"}</button>
                      </div>
                      <h2 padding="0">{selectedMarker.current.timePeriod}: {selectedMarker.current.desc}</h2>
                      <div className="info-window-body">
                        <img className="info-window-image" src={selectedMarker.current.weatherIcon} alt={selectedMarker.current.desc} />
                        <div>
                          <ul className="info-window-list">
                            <table padding="0" className="info-window-content">
                              <tbody>
                                <tr>
                                  <td>Elevation: </td>
                                  <td>{selectedMarker.elevation} {selectedMarker.elevationUnit}</td>
                                </tr>
                                <tr>
                                  <td>Temperature: </td>
                                  <td>{selectedMarker.current.temp} °{selectedMarker.current.tempUnit} {selectedMarker.current.trend ? `( ${selectedMarker.current.trend} )` : ``}</td>
                                </tr>
                                <tr>
                                  <td>Precipitation: </td>
                                  <td>{selectedMarker.current.precipitation} {selectedMarker.current.precipitationUnit}</td>
                                </tr>
                                <tr>
                                  <td>Rel. Humidity: </td>
                                  <td>{selectedMarker.current.relativeHumidity} {selectedMarker.current.relativeHumidityUnit}</td>
                                </tr>
                                <tr>
                                  <td>Wind Speed: </td>
                                  <td>{selectedMarker.current.windSpeed} ({selectedMarker.current.windDirection})</td>
                                </tr>
                              </tbody>
                            </table>
                          </ul>
                        </div>
                      </div>
                      <p>{selectedMarker.current.fullDesc}</p>
                      <div className="remove-container">
                        <button className="remove-button" onClick={() => removeMarker(selectedMarker.id)}>Remove</button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          )}
        </LoadScript>
      </main>
      {showFilters && (
        <FiltersPanel filters={INIT_FILTER_CONFIG} />
      )}
    </div>
  );
}

export default App;
