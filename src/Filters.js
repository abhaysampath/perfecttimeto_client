export function checkValidTimeOfDay(isDaytime, periodStartTime, periodEndTime, timeFiltersNone){
    if (!isDaytime)
        return false;
    // if (timeFilters) {
    //     if (timeFilters.onlyDaytime) {
    //         if (!isDaytime)
    //             return false;
    //     }
    //     if (utils.dateCompare(periodStartTime, timeFilters.timeBounds.upper) > 0) {
    //         return false;
    //     }
    //     if (utils.dateCompare(periodEndTime, timeFilters.timeBounds.lower) > 0) {
    //         return false;
    //     }
    // }
    return true;
};
export function checkTemperature(temperature, temperatureFilters){
    // if (temperatureFilters) {
    //     if (temperature > temperatureFilters.upper) {
    //         return false;
    //     }
    //     if (temperature < temperatureFilters.lower) {
    //         return false;
    //     }
    // }
    return true;
};
export function checkWindSpeed(windSpeed, windSpeedFilters){
    // if (windSpeedFilters) {
    //     if (windSpeed > windSpeedFilters.upper) {
    //         return false;
    //     }
    //     if (windSpeed < windSpeedFilters.lower) {
    //         return false;
    //     }
    // }
    return true;
};
export function checkPrecipitation(precipitation, precipitationFilters){
    // if (precipitationFilters) {
    //     if (precipitation > precipitationFilters.upper) {
    //         return false;
    //     }
    //     if (precipitation < precipitationFilters.lower) {
    //         return false;
    //     }
    // }
    return true;
};

// export default checkValidTimeOfDay, checkTemperature, checkWindSpeed, checkPrecipitation;