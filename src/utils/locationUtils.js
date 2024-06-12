const STALE_TIME_MINUTES = 5;
const GEOLOCATION_RETRIES = 4;

let mapCenterCache = null;
let lastFetchTime = null;

export const getCurrentLocation = async () => {
  for (let i = 0; i < GEOLOCATION_RETRIES; i++) {
    let timeout = 5000;
    let location = await getNavLocation(i % 2 === 0, timeout);
    if (location && !location.errors) {
      console.log('Got location: ', location);
      return location;
    }
    if (location.errors) {
      console.error(`Error getting location: ${location.errors}`);
      if (location.errors === 'User denied Geolocation') {
        console.error('User denied Geolocation');
        return location;
      } else if (location.errors === 'Location request timed out') {
        timeout += 1500;
      }
    }
  }
};                
export const getNavLocation = async (useHighAccuracy, timeout) => {
  console.log('Getting location from nav');
  if (navigator.geolocation) {
    console.log(`navigator.geolocation is supported: ${JSON.stringify(navigator.geolocation)}`);
    return new Promise((resolve, reject) => {
      console.log('Getting location from nav promise');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got location from nav: ', position.coords);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error(`Error getting location: ${error.message}`);
          if (error.code === 1) {
            console.log('User denied location request');
            return { errors: 'User denied Geolocation' }
          } else if (error.code === 2) {
            console.log('Location unavailable');
            return { errors: 'Location unavailable' }
          } else if (error.code === 3) {
            console.log('Location request timed out');
            return { errors: 'Location request timed out' }
          } else {
            console.error(`Error getting location: ${error}`);
            return { errors: error };
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: timeout,
          maximumAge: STALE_TIME_MINUTES * 60000,
        }
      );
    });
  } else {
    throw new Error('Geolocation is not supported by this browser.');
  }
}

export const getIPLocation = async () => {
  const currentTime = new Date();

  if (mapCenterCache && lastFetchTime && (currentTime - lastFetchTime) / 60000 < STALE_TIME_MINUTES) {
    return mapCenterCache;
  }
  const ipLocationURL = 'https://ipapi.co/json/';
  const response = await fetch(ipLocationURL);
  const data = await response.json();
  const newMapCenter = {
    lat: data.latitude,
    lng: data.longitude,
  };
  mapCenterCache = newMapCenter;
  lastFetchTime = currentTime;

  return newMapCenter;
};

export const getIPLocationV1 = async () => {
  const currentTime = new Date();

  if (mapCenterCache && lastFetchTime && (currentTime - lastFetchTime) / 60000 < STALE_TIME_MINUTES) {
    return mapCenterCache;
  }
  const ipLocationURL = 'https://geolocation-db.com/json/';
  const response = await fetch(ipLocationURL);
  const data = await response.json();
  const newMapCenter = {
    lat: data.latitude,
    lng: data.longitude,
  };
  mapCenterCache = newMapCenter;
  lastFetchTime = currentTime;

  return newMapCenter;
};