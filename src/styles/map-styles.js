//Map Initial Load Settings
export const INITIAL_MAP_CENTER = {
    lat: 40.7128,
    lng: -74.0060
};
export const INITIAL_MAP_OPTIONS = {
    center: { INITIAL_MAP_CENTER }, //lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    mapTypeId: 'terrain'
};

//Map Display Styles
export const DEFAULT_MAP_TYPE = 'terrain';
export const MAP_CONTAINER_STYLE = {
    width: '100vw',  // Full width of the viewport
    height: '100vh'  // Full height of the viewport
};
export const MAP_PARKS_STYLE = [
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }]
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }]
    }
];
export const CUSTOM_MAP_STYLE = [{
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f3f4f4" }]  // Soft grey
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e3eed3" }]  // Pastel green
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#b8e1f2" }]
  }
];
