export const getDateKey = (time, isDaytime) => {
    return new Date(time).toLocaleDateString('en-us');
};
export const getPlacesKey = (lat, lng) => {
    return `${lat},${lng}`;
};
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
    // if (unitCode.includes("degF")) {
    //     return "\u00B0F";
    // } else if (unitCode.includes("degC")) {
    //     return "\u00B0C";
    // }
    if (unitCode === "wmoUnit:m") {
        return "meters";
    } else if (unitCode === "wmoUnit:percent") {
        return "%";
    }
    return unitCode?.replaceAll("wmoUnit:", "");
}
export const loadWeatherForecast = (forecast) => {
    return {
        timePeriod: forecast.name,
        isDaytime: forecast.isDaytime,
        temp: forecast.temperature,
        tempUnit: forecast.temperatureUnit,
        elevation: forecast.elevation,
        elevationUnit: getUnitString(forecast.elevationUnit),
        date: new Date(forecast.startTime).toDateString(),
        dateStr: new Date(forecast.startTime).toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
        startTimeStr: new Date(forecast.startTime).toLocaleTimeString(),
        endTimeStr: new Date(forecast.endTime).toLocaleTimeString(),
        timeRangeStr: (new Date(forecast.startTime).toLocaleTimeString() + "-" + new Date(forecast.endTime).toLocaleTimeString()).replaceAll(":00:00 ", ""),
        dateKey: getDateKey(forecast.startTime, forecast.isDaytime),
        precipitation: forecast.probabilityOfPrecipitation.value,
        precipitationUnit: getUnitString(forecast.probabilityOfPrecipitation.unitCode),
        dewpoint: forecast.dewpoint.value,
        dewpointUnit: forecast.dewpoint.unitCode,
        relativeHumidity: forecast.relativeHumidity.value,
        relativeHumidityUnit: getUnitString(forecast.relativeHumidity.unitCode),
        startTime: new Date(forecast.startTime),
        endTime: new Date(forecast.endTime),
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        trend: forecast.temperatureTrend,
        desc: forecast.shortForecast,
        fullDesc: forecast.detailedForecast,
        weatherIcon: forecast.icon,
    }
};