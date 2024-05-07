import './styles/app.css';
import { useState, useRef, useCallback } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY, WEATHER_PERIOD_LIMIT } from './constants';
import { DEFAULT_MAP_TYPE, INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, MAP_PARKS_STYLE } from "./styles/map-styles";
import TuneIcon from '@mui/icons-material/Tune';
// import { sendMessageIcon } from '@mui/icons-material/ScheduleSend';
import { updatePlacesMap, loadWeatherForecast } from './utils';
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
    const places = searchBoxRef.current.getPlaces();
    const bounds = new window.google.maps.LatLngBounds();
    places?.forEach(place => {
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    mapRef?.fitBounds(bounds);
  };
  const onMapClick = useCallback((e) => {
    const newMarker = {
      id: new Date().toISOString(),
      position: e.latLng.toJSON(),
      key: `${e.latLng.lat()},${e.latLng.lng()}`
    };
    setMarkers((markers) => [...markers, newMarker]);
    setPlacesCounter(placesCounter => placesCounter + 1);
    placesMap.set(newMarker.key, newMarker);
    console.info(`    onMapClick PlacesMap: #${placesCounter} -> ${JSON.stringify(placesMap)}`);
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
        const key = `${position.lat},${position.lng}`;
        addGridToPlacesMap(key, gridX, gridY, forecast_office);
      })
      .catch(error => {
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
      console.log(`      Updated entry in placesMap for ${key}`);
    } else {
      console.log(`      Entry not found in placesMap for ${key}`);
    }
    console.info(`    addGridToPlacesMap PlacesMap: #${placesCounter} -> ${JSON.stringify(placesMap)}`);
    getWeatherData(key, forecast_office, gridX, gridY);
  };
  const getWeatherData = (key, forecast_office, gridX, gridY) => {
    console.log(`  Getting Weather for  ${forecast_office}, ${gridX}, ${gridY}`);
    const nws_forecast_url =
      `https://api.weather.gov/gridpoints/${forecast_office}/${gridX},${gridY}/forecast`
    console.log(`  Calling URL: ${nws_forecast_url}`);
    axios.get(nws_forecast_url)
      .then(response => {
        const forecast_response = response.data;
        updatePlacesMap(placesMap, key, "elevation", forecast_response.properties.elevation.value);
        updatePlacesMap(placesMap, key, "elevationUnit", forecast_response.properties.elevation.unitCode);
        const periods = forecast_response.properties.periods;
        let count = 0;
        periods.forEach((period) => {
          if (count && count >= WEATHER_PERIOD_LIMIT) {
            console.log(`****Only taking ${WEATHER_PERIOD_LIMIT} periods`);
            return;
          } else { count = count + 1; }
          if (checkValidTimeOfDay(period.isDaytime, period.startTime, period.endTime) === false) {
            console.log(`    Skipping nighttime: isDaytime: ${JSON.stringify(period.isDaytime)}`);
            return;
          }
          const precipitation = period.probabilityOfPrecipitation.value
          console.log(`      period.precipitation: ${precipitation}`);
          // if (precipitation && checkPrecipitation(precipitation, weatherFilters.precipitationFilters)) {
          //   console.log(`    Skipping rain: ${JSON.stringify(precipitation)}`);
          //   return;
          // }
          // if (includeAfter)
          console.log(`    NOT SKIPPING: ${JSON.stringify(period)}`);
          addWeatherForecastToPlaces(key, period.startTime, period);
          console.log(`**  Period: ${JSON.stringify(period.startTime)}`);
        });
        if (!placesMap.get(key).forecast || placesMap.get(key).forecast.length === 0) {
          console.log(`No matching points, add first entry to show`);
          addWeatherForecastToPlaces(key, periods[0].startTime, periods[0]);
        };
      });
  };

  const addWeatherForecastToPlaces = (key, startTime, newForecast) => {
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
  }

  //Add Marker
  const onMarkerClick = useCallback((marker) => {
    marker['forecast'] = placesMap.get(marker.key).forecast;
    marker['elevation'] = placesMap.get(marker.key).elevation;
    marker['elevationUnit'] = placesMap.get(marker.key).elevationUnit;
    marker['isDaytime'] = placesMap.get(marker.key).isDaytime;
    marker['current'] = placesMap.get(marker.key).forecast[0];
    marker['num_forecasts'] = placesMap.get(marker.key).forecast.length;
    marker['index'] = 1;
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
      setSelectedMarker({
        ...selectedMarker,
        current: selectedMarker.forecast[newIndex - 1],
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
                                  <td>{selectedMarker.current.elevation} {selectedMarker.current.elevationUnit}</td>
                                </tr>
                                <tr>
                                  <td>Temperature: </td>
                                  <td>{selectedMarker.current.temp} °{selectedMarker.current.tempUnit} ({selectedMarker.current.trend})</td>
                                </tr>
                                <tr>
                                  <td>Precipitation: </td>
                                  <td>{selectedMarker.current.precipitation} {selectedMarker.current.precipitationUnit === 'wmoUnit:percent' ? '%' : selectedMarker.current.precipitationUnit}</td>
                                </tr>
                                <tr>
                                  <td>Rel. Humidity: </td>
                                  <td>{selectedMarker.current.relativeHumidity} {selectedMarker.current.relativeHumidityUnit === 'wmoUnit:percent' ? '%' : selectedMarker.current.relativeHumidityUnit}</td>
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
