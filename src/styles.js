//Search Box Styles
export const SEARCH_BOX_STYLE = {
    boxSizing: "border-box",
    border: "1px solid transparent",
    width: "240px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, .3)",
    fontSize: "16px",
    outline: "none",
    textOverflow: "ellipses",
    position: 'absolute',
    top: '15px',
    right: '70px'
};

//Map Display Styles
export const MAP_CONTAINER_STYLE = {
    width: '100vw',   // Full width of the viewport
    height: '100vh'  // Full height of the viewport
};
export const CUSTOM_MAP_STYLE = [
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        { "color": "#dff2d3" }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        { "color": "#83cead" }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        { "color": "#a2daf2" }
      ]
    }
];