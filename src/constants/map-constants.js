export const PLACES_LIBRARY = ['places'];
// export const SEARCH_ZOOM_LEVEL = 10;
export const DEFAULT_ZOOM_LEVEL = 14;
export const INITIAL_ZIP_CODE = '11232';
export const DEFAULT_MAP_TYPE = 'satellite';
export const INITIAL_MAP_CENTER = // { lat: 40.7128, lng: -74.0060 }; // New York City
    { lat: 40.69805005156146, lng: -74.0060546959678 } //Downtown NYC, above the water
export function fullMinusHeader() {
    let fullHeight = window.innerHeight || 800;
    let headerHeight = 65;
    return (100 * (fullHeight - headerHeight) / fullHeight) + 'vh';
}
export const MAP_CONTAINER_STYLE = {
    width: '100vw',
    height: fullMinusHeader()
};
export const MAP_PARKS_STYLE = [{
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
}, {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
}, {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
}];
export const INITIAL_MAP_OPTIONS = {
    // center: { INITIAL_MAP_CENTER },
    showMapControls: false,
    mapTypeId: DEFAULT_MAP_TYPE,
    clickableIcons: false,
    mapStyle: MAP_PARKS_STYLE,
    // gestureHandling: 'greedy',
    // scrollwheel: false,
};
export const SEARCH_BOX_STYLE = {
    boxSizing: "border-box",
    border: "1px solid transparent",
    width: "60%",
    maxWidth: "400px",
    minWidth: "150px",
    height: "36px",
    padding: "12px",
    borderRadius: "20px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, .3)",
    fontSize: "16px",
    outline: "none",
    textOverflow: "ellipses",
    position: 'absolute',
    bottom: '37px',
    left: '75px'
};
