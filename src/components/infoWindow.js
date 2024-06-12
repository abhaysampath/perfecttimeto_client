import React, { useCallback } from 'react';
import { InfoWindow } from '@react-google-maps/api';
import '../styles/infoWindow.css';

const InfoWindowComponent = ({ selectedMarker, navigateDailyForecast, setSelectedMarker, setMarkers, activity }) => {
    const removeMarker = useCallback((id) => {
        setMarkers((markers) => markers.filter(m => m.id !== id));
        setSelectedMarker(null);
    }, [setMarkers, setSelectedMarker]);
    return (
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
                        <table padding="0" width={"100%"} className="info-window-content">
                            <tbody>
                                <tr>
                                    <td width={"40%"}>Wind Speed:</td>
                                    <td>{selectedMarker.current.windSpeed} ({selectedMarker.current.windDirection})</td>
                                </tr>
                                {selectedMarker.current.temp && <tr>
                                    <td>Temperature:</td>
                                    <td>{selectedMarker.current.temp} °{selectedMarker.current.tempUnit} {selectedMarker.current.trend ? `(${selectedMarker.current.trend})` : ``}</td>
                                </tr>}
                                {selectedMarker.current.precipitation && <tr>
                                    <td>Precipitation: </td>
                                    <td>{selectedMarker.current.precipitation} {selectedMarker.current.precipitationUnit}</td>
                                </tr>}
                            </tbody>
                        </table>
                        <details className="info-window-content" style={{ textAlign: "left" }}>
                            <summary>Humidity / Dewpoint / Elevation</summary>
                            <table padding="0" width={"100%"}>
                                <tbody>
                                    {selectedMarker.current.relativeHumidity && <tr>
                                        <td>Humidity: </td>
                                        <td>{selectedMarker.current.relativeHumidity} {selectedMarker.current.relativeHumidityUnit}</td>
                                    </tr>}
                                    {selectedMarker.location.elevation && <tr>
                                        <td>Elevation: </td>
                                        <td>{selectedMarker.location.elevation} {selectedMarker.location.elevationUnit}</td>
                                    </tr>}
                                    {selectedMarker.current.dewpoint && <tr>
                                        <td>Dewpoint: </td>
                                        <td>{selectedMarker.current.dewpoint} {selectedMarker.current.dewpointUnit}</td>
                                    </tr>}
                                </tbody>
                            </table>
                        </details>
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
        </InfoWindow >
    );
};

export default InfoWindowComponent;