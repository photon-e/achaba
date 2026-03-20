import * as Location from "expo-location";

export const getCurrentCoordinates = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { latitude: 6.5244, longitude: 3.3792 };
  }

  const location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  };
};
