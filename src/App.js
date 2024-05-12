import './styles/app.css';
import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY, WEATHER_PERIOD_LIMIT, SHOW_FILTERS_ON_LOAD } from './constants';
import { DEFAULT_MAP_TYPE, INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, MAP_PARKS_STYLE } from "./styles/map-styles";
import TuneIcon from '@mui/icons-material/Tune';
// import { sendMessageIcon } from '@mui/icons-material/ScheduleSend';
import { loadWeatherForecast, getPlacesKey, getUnitString, loadNWSData, getShortDate, daysInFuture, printMap } from './utils';
import { SEARCH_BOX_STYLE } from './styles';
import { LoadingScreen } from './LoadingScreen';
import { INIT_FILTER_CONFIG } from './filtersConfig';
import { FiltersPanel } from './FiltersPanel';
import axios from 'axios';
// import { checkValidTimeOfDay, checkTemperature, checkWindSpeed, checkPrecipitation } from './Filters';

function App() {
  const [mapRef, setMapRef] = useState(null);
  const [activity] = useState("fly a kite");
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const searchBoxRef = useRef(null);
  let forecastsMap = new Map(); // { lat,lng } => { daily:{}, hourly:{}, location:{} }
  const [placesCounter, setPlacesCounter] = useState(0);
  const [showFilters, setShowFilters] = useState(SHOW_FILTERS_ON_LOAD);

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
  const getGridXY = (marker) => {
    const nws_weather_url = `https://api.weather.gov/points/${marker.placeKey}`;
    console.log(`    Getting gridXY with ${nws_weather_url}`);
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
      case 'location':
        console.log(` current place.location ${JSON.stringify(place.location)}`);
        console.log(` new place.location ${JSON.stringify(jsonValue)}`);
        if (!place.location) {
          place.location = { ...jsonValue };
        } else {
          place.location = { ...place.location, ...jsonValue };
        }
        break;
      default:
        console.error(`Unknown jsonKey, skipping: ${JSON.stringify(jsonKey)} ${JSON.stringify(jsonValue)}`);
    }

  };
  //Read Hourly NWS Weather Data
  const getWeatherData = (placeKey, timePeriod, forecastOffice, gridX, gridY) => {
    console.log(`  getWeatherData - p: ${JSON.stringify(placeKey)}, t: ${timePeriod}, x: ${gridX}, y: ${gridY}`);
    const nws_forecast_url = `https://api.weather.gov/gridpoints/${forecastOffice}/${gridX},${gridY}/forecast/`
      + (timePeriod === 'hourly' ? `hourly` : ``);
    axios.get(nws_forecast_url)
      .then(response => {
        addToForecastsMap(placeKey, "location", {
          elevation: response.data.properties.elevation.value,
          elevationUnit: getUnitString(response.data.properties.elevation.unitCode)
        })
        let data = [], count = response.data.properties.periods.length;
        for (let i = 0; (i < WEATHER_PERIOD_LIMIT && i < count - 1); i++) {
          const weatherData = loadWeatherForecast(response.data.properties.periods[i]);
          data.push(weatherData);  //TODO: Don't load nulls
        };
        return data;
      }).then((data) => {
        addToForecastsMap(placeKey, timePeriod, { ...data });
      }).catch(e => {
        console.error(`ERROR: ${e} , ${JSON.stringify(e)}`);
      })
    console.info(` exiting getWeatherData after fetching ${timePeriod}`);
  };
  //Place Marker on Map, start fetching data
  const onMapClick = useCallback((e) => {
    console.log(`  Map Click: ${JSON.stringify(e)}`);
    const placeKey = getPlacesKey(e.latLng.lat(), e.latLng.lng());
    //Move this to a separate method that can be called for nearby places
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
    console.log(`    add newMarker ${JSON.stringify(newMarker)}`);
    printMap(forecastsMap, 'onMapClick');
    getGridXY(newMarker);
    // onMarkerClick(newMarker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    console.log(`Markers updated: ${JSON.stringify(markers)}`);
  }, [markers]);

  const filterForecastsByDate = (forecasts, markerDateStr) => {
    if (forecasts === undefined) { console.error(`  Empty forecasts map: ${forecasts}`) }
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
    console.log(`  Marker placeKey: ${marker['placeKey']}`);
    marker['dateIndex'] = 0;
    console.log(`  Date INDEX : ${JSON.stringify(marker['dateIndex'])}`);

    let place = forecastsMap.get(marker['placeKey']);
    if (!place || place === undefined) {
      console.error("Place not yet loaded, return doing nothing.");
      // re-trigger missing info? getGridXY(format(marker) );
      return;
    }
    marker['location'] = place["location"];
    console.log(` MARKER  nwsData : ${JSON.stringify(marker['location'])}`);
    //This part will change by date, Move to separate method
    const markerDateStr = getShortDate(daysInFuture(marker['dateIndex']));
    marker['markerDate'] = markerDateStr;
    console.log(`  markerDate : ${marker['markerDate']}`);
    marker['daily'] = place["daily"];
    marker['hourly'] = place["hourly"];
    marker['current'] = filterForecastsByDate(place["daily"], markerDateStr)[0]; //0 for daytime, update to get based on hour
    // console.log(`  FILTERED current : ${JSON.stringify(marker['current'])}`);
    // marker['hourlies'] = filterForecastsByDate(place["hourly"], markerDateStr);
    // console.log(`  FILTERED hourlies : ${JSON.stringify(marker['hourlies'])}`);
    marker['num_forecasts'] = 6; //place["daily"]?.length;
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
    console.log(`  read selectedMarker ${JSON.stringify(selectedMarker.dateIndex)}`);
    // if (!selectedMarker || !selectedMarker.dateIndex) return;
    const newIndex = selectedMarker.dateIndex + direction;
    console.log(`  nI ${newIndex}  = sMi ${selectedMarker.dateIndex} + d ${direction}`);
    if (newIndex >= 0 && newIndex <= selectedMarker.num_forecasts) {
      const markerDateStr = getShortDate(daysInFuture(newIndex));
      const current = filterForecastsByDate(selectedMarker["daily"], markerDateStr)[0]; //0 for daytime, update to get based on hour
      current['markerDate'] = markerDateStr;
      console.log(`  read markerDateStr ${JSON.stringify(markerDateStr)}`);
      console.log(`  FILTERED current : ${JSON.stringify(current)}`);
      // current['hourlies'] = filterForecastsByDate(selectedMarker["hourly"], markerDateStr);
      // console.log(`  FILTERED hourlies : ${JSON.stringify(selectedMarker['hourlies'])}`);
      // current['currentHourly'] = selectedMarker['hourlies'][0];
      // console.log(`  currentHourly : ${JSON.stringify(selectedMarker['currentHourly'])}`);
      current['num_forecasts'] = selectedMarker["hourlies"]?.length;
      console.log(`  MARKER num_forecasts : ${JSON.stringify(selectedMarker['num_forecasts'])}`);
      setSelectedMarker({
        ...selectedMarker,
        current: current,
        dateIndex: newIndex
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
                    <div className="info-window" >
                      <div className='info-window-time-select'>
                        <button className="nav-button" onClick={() => navigateDailyForecast(-1)} disabled={selectedMarker.dateIndex === 0}>
                          {"<<  "}</button>
                        <h4 className="info-window-title">
                          {selectedMarker.current.shortDate}  {selectedMarker.current.timeRangeStr}   ( {selectedMarker.dateIndex + 1} / {selectedMarker.num_forecasts} )</h4>
                        <button className="nav-button" onClick={() => navigateDailyForecast(1)} disabled={selectedMarker.dateIndex === selectedMarker.num_forecasts}>
                          {"  >>"}</button>
                      </div>
                      <h2 padding="0">{selectedMarker.current.timePeriod}: {selectedMarker.current.desc}</h2>
                      <div className="info-window-body">
                        <img className="info-window-image" src={selectedMarker.current.weatherIcon} alt={selectedMarker.current.desc} />
                        <div>
                          <ul className="info-window-list">
                            <table padding="0" className="info-window-content">
                              <tbody>
                                {selectedMarker.location.elevation && <tr>
                                  <td>Elevation: </td>
                                  <td>{selectedMarker.location.elevation} {selectedMarker.location.elevationUnit}</td>
                                </tr>}
                                {selectedMarker.current.temp && <tr>
                                  <td>Temperature: </td>
                                  <td>{selectedMarker.current.temp} °{selectedMarker.current.tempUnit} {selectedMarker.current.trend ? `( ${selectedMarker.current.trend} )` : ``}</td>
                                </tr>}
                                {selectedMarker.current.precipitation && <tr>
                                  <td>Precipitation: </td>
                                  <td>{selectedMarker.current.precipitation} {selectedMarker.current.precipitationUnit}</td>
                                </tr>}
                                {selectedMarker.current.relativeHumidity && <tr>
                                  <td>Rel. Humidity: </td>
                                  <td>{selectedMarker.current.relativeHumidity} {selectedMarker.current.relativeHumidityUnit}</td>
                                </tr>}
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
