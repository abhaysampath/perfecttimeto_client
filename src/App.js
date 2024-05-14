import './styles/app.css';
import { useState, useRef, useCallback } from "react";
import { GoogleMap, StandaloneSearchBox, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_ZOOM_LEVEL, PLACES_LIBRARY, SHOW_FILTERS_ON_LOAD } from './constants';
import { DEFAULT_MAP_TYPE, INITIAL_MAP_CENTER, INITIAL_MAP_OPTIONS, MAP_CONTAINER_STYLE, MAP_PARKS_STYLE } from "./styles/map-styles";
import TuneIcon from '@mui/icons-material/Tune';
// import { sendMessageIcon } from '@mui/icons-material/ScheduleSend';
import { loadWeatherForecast, getPlacesKey, convertFromMeters, loadNWSData } from './utils';
import { SEARCH_BOX_STYLE } from './styles';
import { LoadingScreen } from './LoadingScreen';
import { INIT_FILTER_CONFIG } from './filtersConfig';
import axios from 'axios';
import SliderComponent from './SliderComponent';
// import { checkValidTimeOfDay, checkTemperature, checkWindSpeed, checkPrecipitation } from './Filters';

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
        let [elevation, elevationUnit] = convertFromMeters(
          response.data.properties.elevation.value,
          response.data.properties.elevation.unitCode);
        addToForecastsMap(placeKey, "location", { elevation, elevationUnit });
        let data = [], count = response.data.properties.periods.length;
        for (let i = 0; i < count - 1; i++) {
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
    getGridXY(newMarker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const getUniqueShortDates = (input) => {
    const uniqueDates = new Set();
    input.forEach((obj) => {
      Object.values(obj).forEach((value) => {
        uniqueDates.add(value.shortDate)
      })
    });
    return Array.from(uniqueDates);
  };
  //Apply Weather Filters
  const checkAllFilters = (forecast) => {
    let failedFilters = [];
    if (forecast === undefined) { return; }
    for (const slider of sliderStates) {
      if (!slider.isEnabled) { continue; }
      switch (slider.name) {
        case "Temperature":
          if (forecast["temp"]) {
            const check = checkSliderRange(slider, forecast["temp"]);
            if (check < 0) {
              failedFilters.push("Too Cold");
            } else if (check > 0) {
              failedFilters.push("Too Hot");
            }
          }
          break;
        case "Wind Speed":
          if (forecast["windSpeed"]) {
            const check = isWindSpeedWithinSliderRange(slider, forecast["windSpeed"]);
            if (check < 0) {
              failedFilters.push("Not Windy Enough");
            } else if (check > 0) {
              failedFilters.push("Too Windy");
            }
          }
          break;
        case "Precipitation":
          if (forecast["precipitation"]) {
            const check = checkSliderRange(slider, forecast["precipitation"]);
            if (check > 0) {
              failedFilters.push("Too Wet");
            }
          }
          break;
        default:
          console.error(`Unknown slider.name, skipping: ${JSON.stringify(slider.name)} ${JSON.stringify(slider)}`);
          break;
      }
    }
    return failedFilters;
  };
  const isWindSpeedWithinSliderRange = (slider, forecastString) => {
    const rangeMatch = forecastString.match(/(\d+) to (\d+)/);
    const singleMatch = forecastString.match(/(\d+)/);
    const forecastLower = parseInt(rangeMatch ? rangeMatch[1] : (singleMatch ? singleMatch[1] : null), 10);
    const forecastUpper = parseInt(rangeMatch ? rangeMatch[2] : (singleMatch ? singleMatch[1] : null), 10);
    if (!forecastLower || !forecastUpper) {
      throw new Error(`Could not extract wind speed from forecast: ${forecastString}`);
    }
    if (forecastUpper < slider.sliderValue[0]) {
      return -1;
    } else if (forecastLower > slider.sliderValue[1]) {
      return 1;
    } else {
      return 0;
    }
  };
  const checkSliderRange = (sliderStates, forecastValue) => {
    console.log(` ${sliderStates.name} ${forecastValue}<${sliderStates.sliderValue[0]} || ${forecastValue}>${sliderStates.sliderValue[1]}`);
    if (forecastValue < sliderStates.sliderValue[0]) {
      return -1;
    } else if (forecastValue > sliderStates.sliderValue[1]) {
      console.error(` EXCLUDE: ${sliderStates.name}  ${forecastValue} NOT in ${JSON.stringify(sliderStates.sliderValue)} `);
      return 1;
    }
    console.warn(` INCLUDE: ${sliderStates.name}  ${forecastValue} in ${JSON.stringify(sliderStates.sliderValue)} `);
    return 0;
  };
  //Show InfoWindow, populate with data
  const onMarkerClick = useCallback((marker) => {
    console.log(`  Marker placeKey: ${marker['placeKey']}`);
    marker['dateIndex'] = 0;
    console.log(`  Date INDEX : ${JSON.stringify(marker['dateIndex'])}`);

    let place = forecastsMap.get(marker['placeKey']);
    if (!place || place === undefined || place['daily'] === undefined) {
      console.error("Place not yet loaded, return doing nothing.");
      // re-trigger missing info? getGridXY(format(marker) );
      return;
    }
    console.log(`  place daily: ${JSON.stringify(place['daily'])}`);
    marker['uniqueDates'] = getUniqueShortDates(place['daily']);
    console.log(`  place unique dates: (${JSON.stringify(marker['uniqueDates'].length)}) ${JSON.stringify(marker['uniqueDates'])}`);
    marker['location'] = place["location"];
    console.log(` MARKER  nwsData : ${JSON.stringify(marker['location'])}`);
    marker['daily'] = place["daily"];
    marker['hourly'] = place["hourly"];
    //This part will change by date, Move to separate method
    const markerDateStr = marker['uniqueDates'][marker['dateIndex']];
    // getShortDate(daysInFuture(marker['dateIndex']));
    marker['markerDate'] = markerDateStr;
    console.log(`  markerDate : ${marker['markerDate']}`);
    marker['current'] = filterForecastsByDate(marker["daily"], markerDateStr)[0]; //0 for daytime, update to get based on hour
    console.log(`  FILTERED current : ${JSON.stringify(marker['current'])}`);
    const failedFilters = checkAllFilters(marker['current']);
    console.log(` failedFilters ${JSON.stringify(failedFilters)}`);
    marker['failedFilters'] = failedFilters;
    marker['failedStr'] = failedFilters ? failedFilters.join(', ') : '';
    console.log(` failedStr ${JSON.stringify(marker['failedStr'])}`);
    marker['allSuccess'] = (failedFilters.length === 0);
    console.log(` allSuccess ${JSON.stringify(marker['allSuccess'])}`);
    // marker['hourlies'] = filterForecastsByDate(marker["hourly"], markerDateStr);
    // console.log(`  FILTERED hourlies by date : ${JSON.stringify(marker['hourlies'])}`);
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
      const failedFilters = checkAllFilters(current);
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
                mapTypeId={DEFAULT_MAP_TYPE}
                showMapTypeId={false}
                mapStyle={MAP_PARKS_STYLE}
                center={INITIAL_MAP_CENTER}
                zoom={DEFAULT_ZOOM_LEVEL}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                clickableIcons={false}
                // mapTypeIdButton={false}
                mapOptions={INITIAL_MAP_OPTIONS}
                // tilt={(90)}
                // featureType={"parks"}
                // scrollwheel={false}
                // navigationControl={false}
              // scaleControl={false}
              // draggable={false}
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
                        {selectedMarker.current &&
                          <h4>{selectedMarker.current.dateStr} ( {selectedMarker.dateIndex + 1} / {selectedMarker.num_dailies} )</h4>
                        }
                        {/* {selectedMarker.current.shortDate}  {selectedMarker.current.timeRangeStr}  */}
                        <button className="nav-button" onClick={() => navigateDailyForecast(1)} disabled={!selectedMarker.current || (selectedMarker.dateIndex + 1 === selectedMarker.num_dailies)}>
                          {"  >>"}</button>
                      </div>
                      <h3 className="info-window-title">
                        {selectedMarker.current.timePeriod}: {selectedMarker.current.desc}</h3>
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
                            textOverflow: 'ellipsis'
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
              onSliderChange={handleSliderChange} />
          })}
        </div>
      )}
    </div>
  );
}

export default App;
