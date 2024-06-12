export const getUniqueShortDates = (input) => {
    const uniqueDates = new Set();
    input.forEach((obj) => {
        Object.values(obj).forEach((value) => {
            uniqueDates.add(value.shortDate)
        })
    });
    return Array.from(uniqueDates);
};
export const filterForecastsByDate = (forecasts, markerDateStr) => {
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
//Apply Weather Filters
export const checkAllFilters = (forecast, sliderStates) => {
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
export const isWindSpeedWithinSliderRange = (slider, forecastString) => {
    const rangeMatch = forecastString.match(/(\d+) to (\d+)/);
    const singleMatch = forecastString.match(/(\d+)/);
    const forecastLower = parseInt(rangeMatch ? rangeMatch[1] : (singleMatch ? singleMatch[1] : null), 10);
    const forecastUpper = parseInt(rangeMatch ? rangeMatch[2] : (singleMatch ? singleMatch[1] : null), 10);
    if (forecastLower===undefined || !forecastUpper) {
        console.warn(`IGNORING: Could not extract wind speed from forecast: ${forecastString}`);
        return 0;
    }
    if (forecastUpper < slider.sliderValue[0]) {
        return -1;
    } else if (forecastLower > slider.sliderValue[1]) {
        return 1;
    }
    return 0;
};
export const checkSliderRange = (sliderStates, forecastValue) => {
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