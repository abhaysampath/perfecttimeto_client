export const INIT_FILTER_CONFIG = [{
  name: "Temperature",
  bounds: {
    lower: 40,
    upper: 100
  },
  units: "\u00B0F",
  init: {
    lower: 65,
    upper: 90
  },
},
{
  name: "Wind Speed",
  bounds: {
    lower: 0,
    upper: 50,
  },
  units: "mph",
  init: {
    lower: 10,
    upper: 25
  },
},
{
  name: "Precipitation",
  bounds: {
    lower: 0,
    upper: 100,
  },
  units: "%",
  init: {
    lower: 0,
    upper: 25
  }
}];