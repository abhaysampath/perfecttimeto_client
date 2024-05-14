export const INITIAL_MAP_CENTER = {
    lat: 40.7128,
    lng: -74.0060
};
export const DEFAULT_MAP_TYPE = 'terrain';
export const INITIAL_MAP_OPTIONS = {
    center: { INITIAL_MAP_CENTER },
    zoom: 12,
    mapTypeId: DEFAULT_MAP_TYPE
};
export const MAP_CONTAINER_STYLE = {
    width: '100vw',
    height: '95vh'
};
export const MAP_PARKS_STYLE = [{
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
    }, {
        featureType: "transit",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
    }, {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }],
    },
];
