import { CONVERT_METERS_TO_FEET, CONVERT_METERS_TO_MILES, WEATHER_URL } from "../constants/constants";

export const getDateKey = (time, isDaytime) => {
    return new Date(time).toLocaleDateString('en-us');
};
export const getShortDate = (d) => {
    return new Date(d).toLocaleDateString('en-us');
};
export const daysInFuture = (n = 0) => {
    return new Date().setDate(new Date().getDate() + n);
};
export const getPlacesKey = (lat, lng) => {
    return `${lat},${lng}`;
};
// export const getFilterLocations = (forecastsMap) => {
//     console.log(`ABAB In getFilterLocations with forecastsMap.count: ${forecastsMap.size}`);
//     let locations = [];
//     forecastsMap.forEach((value, key) => {
//         console.log(`ABABABA  key: ${key}, value: ${value}`);
//         if (value.latitude && value.longitude && value.description) {
//             locations.push({
//                 latitude: value.latitude,
//                 longitude: value.longitude,
//                 // description: {value.geocode.locationName} - {value.geocode.neighbourhood}, {value.geocode.city}, {value.geocode.state}
//             });
//         }
//     });
//     return locations;
// }

export const dateCompare = (periodTime, filterTimeBound) => {
    if (periodTime.getHours() === filterTimeBound.hours) {
        if (periodTime.getMinutes() === filterTimeBound.minutes) {
            return 0;
        } else if (periodTime.getMinutes() > filterTimeBound.minutes) {
            return 1;
        } else {
            return -1;
        }
    } else if (periodTime.getHours() > filterTimeBound.hours) {
        return 1;
    } else {
        return -1;
    }
    // if (new Date(periodStartTime).getHours() > timeFilters.timeBounds.upper.hours) {
};
export const parseConfig = (str) => {
    const regex = /name="([^"]+)",\s*minSlider=(true|false),\s*maxSlider=(true|false),\s*min=(\d+),\s*max=(\d+),\s*units="([^"]+)"/;
    const match = str.match(regex);
    const filters = [];
    if (match) {
        const [, name, minSlider, maxSlider, min, max, units] = match;
        filters.push({
            name,
            minSlider: minSlider === 'true',
            maxSlider: maxSlider === 'true',
            min: parseInt(min),
            max: parseInt(max),
            units
        });
    }
    return filters;
};
export const getUnitString = (unitCode) => {
    if (!unitCode) { return unitCode; }
    if (unitCode.includes("degF")) {
        return "\u00B0F";
    } else if (unitCode.includes("degC")) {
        return "\u00B0C";
    }
    if (unitCode === "wmoUnit:m") {
        return "m";
    } else if (unitCode === "wmoUnit:percent") {
        return "%";
    };
    return unitCode.replaceAll("wmoUnit:", "");
};
export const convertFromMeters = (value, origUnits) => {
    if (origUnits === "meters" || origUnits === "wmoUnit:m") {
        if (value > 2000) {
            value = (CONVERT_METERS_TO_MILES * value).toFixed();
            origUnits = "miles";
        } else {
            value = (CONVERT_METERS_TO_FEET * value).toFixed()
            origUnits = "ft";
        }
    }
    return [value, getUnitString(origUnits)];
};
export const loadNWSData = (nws_data) => {
    return {
        gridX: nws_data.properties.gridX,
        gridY: nws_data.properties.gridY,
        forecastOffice: nws_data.properties.cwa,
        city: nws_data.properties.relativeLocation.properties.city,
        state: nws_data.properties.relativeLocation.properties.state,
    };
}
export const loadWeatherForecast = (forecast) => {
    return {
        timePeriod: forecast.name,
        isDaytime: forecast.isDaytime,
        temp: forecast.temperature,
        tempUnit: forecast.temperatureUnit,
        date: new Date(forecast.startTime).toDateString(),
        dateStr: new Date(forecast.startTime).toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
        startTimeStr: new Date(forecast.startTime).toLocaleTimeString(),
        endTimeStr: new Date(forecast.endTime).toLocaleTimeString(),
        shortDate: getShortDate(forecast.startTime),
        timeRangeStr: (new Date(forecast.startTime).toLocaleTimeString() + "-" + new Date(forecast.endTime).toLocaleTimeString()).replaceAll(":00:00 ", ""),
        dateKey: getDateKey(forecast.startTime, forecast.isDaytime),
        precipitation: forecast.probabilityOfPrecipitation && forecast.probabilityOfPrecipitation.value ? forecast.probabilityOfPrecipitation.value : undefined,
        precipitationUnit: forecast.probabilityOfPrecipitation && forecast.probabilityOfPrecipitation.unitCode ? getUnitString(forecast.probabilityOfPrecipitation.unitCode) : undefined,
        dewpoint: forecast.dewpoint ? forecast.dewpoint.value.toFixed(2) : undefined,
        dewpointUnit: forecast.dewpoint ? getUnitString(forecast.dewpoint.unitCode) : undefined,
        relativeHumidity: forecast.relativeHumidity ? forecast.relativeHumidity.value : undefined,
        relativeHumidityUnit: forecast.relativeHumidity ? getUnitString(forecast.relativeHumidity.unitCode) : undefined,
        startTime: new Date(forecast.startTime),
        endTime: new Date(forecast.endTime),
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        trend: forecast.temperatureTrend,
        desc: forecast.shortForecast,
        fullDesc: forecast.detailedForecast,
        weatherIcon: forecast.icon ? WEATHER_URL + forecast.icon : undefined,
    }
};
