import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { subscribeToRideChannel } from "@/services/firebaseService";
import { getApiErrorMessage } from "@/services/api";
import { fetchNearbyRiders, NearbyRider, requestRide, watchRideHistory } from "@/services/rideService";
import { getCurrentCoordinates } from "@/utils/location";

const DEFAULT_PICKUP = { latitude: 6.5244, longitude: 3.3792 };
const DEFAULT_DESTINATION = { latitude: 6.6018, longitude: 3.3515 };

const parseCoordinate = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isValidCoordinate = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
};

export const CustomerHomeScreen = () => {
  const { activeRide, session, setActiveRide, setSession } = useApp();
  const [pickupLat, setPickupLat] = useState(DEFAULT_PICKUP.latitude.toFixed(5));
  const [pickupLng, setPickupLng] = useState(DEFAULT_PICKUP.longitude.toFixed(5));
  const [destinationLat, setDestinationLat] = useState(DEFAULT_DESTINATION.latitude.toFixed(5));
  const [destinationLng, setDestinationLng] = useState(DEFAULT_DESTINATION.longitude.toFixed(5));
  const [requesting, setRequesting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyRider[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("Checking your pickup location...");

  const coordinateErrors = useMemo(
    () => ({
      pickupLat: pickupLat ? (isValidCoordinate(pickupLat, -90, 90) ? "" : "Latitude must be between -90 and 90.") : "",
      pickupLng: pickupLng ? (isValidCoordinate(pickupLng, -180, 180) ? "" : "Longitude must be between -180 and 180.") : "",
      destinationLat: destinationLat
        ? isValidCoordinate(destinationLat, -90, 90)
          ? ""
          : "Latitude must be between -90 and 90."
        : "",
      destinationLng: destinationLng
        ? isValidCoordinate(destinationLng, -180, 180)
          ? ""
          : "Longitude must be between -180 and 180."
        : ""
    }),
    [destinationLat, destinationLng, pickupLat, pickupLng]
  );

  const hasCoordinateError = Object.values(coordinateErrors).some(Boolean);
  const pickupLatitude = parseCoordinate(pickupLat, DEFAULT_PICKUP.latitude);
  const pickupLongitude = parseCoordinate(pickupLng, DEFAULT_PICKUP.longitude);
  const destinationLatitude = parseCoordinate(destinationLat, DEFAULT_DESTINATION.latitude);
  const destinationLongitude = parseCoordinate(destinationLng, DEFAULT_DESTINATION.longitude);

  useEffect(() => {
    let isMounted = true;

    getCurrentCoordinates()
      .then((coords) => {
        if (!isMounted) {
          return;
        }
        setPickupLat(coords.latitude.toFixed(5));
        setPickupLng(coords.longitude.toFixed(5));
        setLocationMessage("Pickup updated with your current location.");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setLocationMessage("Using Lagos defaults because location access is unavailable.");
      })
      .finally(() => {
        if (isMounted) {
          setLoadingLocation(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeRide) {
      return undefined;
    }

    const unsubscribeRealtime = subscribeToRideChannel(`ride-${activeRide.id}`, (payload) => {
      if (payload.status) {
        setActiveRide((currentRide) =>
          currentRide ? { ...currentRide, status: payload.status as typeof currentRide.status } : currentRide
        );
      }
    });

    const unsubscribePolling = watchRideHistory(
      (rides) => rides.find((ride) => ride.id === activeRide.id) ?? null,
      (ride) => {
        if (ride) {
          setActiveRide(ride);
          return;
        }

        setActiveRide(null);
      },
      {
        onError: (error) => {
          setErrorMessage((currentMessage) => currentMessage || getApiErrorMessage(error, "Unable to refresh the latest ride status."));
        }
      }
    );

    return () => {
      unsubscribeRealtime();
      unsubscribePolling();
    };
  }, [activeRide?.id, setActiveRide]);

  const loadNearbyRiders = async (forceRefresh = false) => {
    if (hasCoordinateError) {
      return;
    }

    setLoadingNearby(true);
    try {
      const riders = await fetchNearbyRiders(pickupLatitude, pickupLongitude, { forceRefresh });
      setNearbyRiders(riders);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load nearby riders right now."));
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    loadNearbyRiders().catch(() => undefined);
  }, [pickupLatitude, pickupLongitude, hasCoordinateError]);

  const mapRegion = useMemo(
    () => ({
      latitude: pickupLatitude,
      longitude: pickupLongitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08
    }),
    [pickupLatitude, pickupLongitude]
  );

  const handleRideRequest = async () => {
    if (hasCoordinateError) {
      setErrorMessage("Please enter valid pickup and destination coordinates.");
      return;
    }

    setRequesting(true);
    setErrorMessage("");
    try {
      const response = await requestRide({
        pickup_lat: pickupLatitude,
        pickup_lng: pickupLongitude,
        destination_lat: destinationLatitude,
        destination_lng: destinationLongitude
      });
      setActiveRide(response.ride);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Request failed. Please confirm the coordinates and try again."));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Screen>
      <View className="mb-5 rounded-[32px] bg-slate-900 p-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-white">Ready for your next ride?</Text>
            <Text className="mt-2 text-base leading-6 text-slate-300">{session?.user.phone_number}</Text>
          </View>
          <Button title="Logout" onPress={() => setSession(null)} variant="ghost" />
        </View>
        <View className="mt-5 flex-row flex-wrap gap-3">
          <View className="min-w-[110px] flex-1 rounded-2xl bg-white/10 p-4">
            <Text className="text-sm text-slate-300">Nearby riders</Text>
            <Text className="mt-1 text-2xl font-bold text-white">{nearbyRiders.length}</Text>
          </View>
          <View className="min-w-[110px] flex-1 rounded-2xl bg-white/10 p-4">
            <Text className="text-sm text-slate-300">Ride status</Text>
            <Text className="mt-1 text-lg font-bold capitalize text-white">{activeRide?.status ?? "idle"}</Text>
          </View>
        </View>
      </View>

      <View className="mb-4 overflow-hidden rounded-[28px] bg-white shadow-sm">
        <MapView style={{ height: 280 }} initialRegion={mapRegion} region={mapRegion}>
          <Marker coordinate={{ latitude: pickupLatitude, longitude: pickupLongitude }} title="Pickup" />
          <Marker
            coordinate={{ latitude: destinationLatitude, longitude: destinationLongitude }}
            title="Destination"
            pinColor="green"
          />
          <Polyline
            coordinates={[
              { latitude: pickupLatitude, longitude: pickupLongitude },
              { latitude: destinationLatitude, longitude: destinationLongitude }
            ]}
            strokeColor="#16a34a"
            strokeWidth={4}
          />
        </MapView>
        <View className="border-t border-slate-100 px-4 py-3">
          <Text className="text-sm text-slate-500">{loadingLocation ? "Detecting your location..." : locationMessage}</Text>
        </View>
      </View>

      <View className="rounded-[28px] bg-white p-5 shadow-sm">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-slate-900">Request an okada</Text>
            <Text className="mt-1 text-sm text-slate-500">Set pickup and destination coordinates, then send a request.</Text>
          </View>
          <Button title="Refresh riders" onPress={() => loadNearbyRiders(true)} loading={loadingNearby} variant="ghost" />
        </View>

        {errorMessage ? (
          <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <Text className="text-sm text-rose-700">{errorMessage}</Text>
          </View>
        ) : null}

        <Input
          label="Pickup latitude"
          value={pickupLat}
          onChangeText={setPickupLat}
          keyboardType="numeric"
          error={coordinateErrors.pickupLat}
        />
        <Input
          label="Pickup longitude"
          value={pickupLng}
          onChangeText={setPickupLng}
          keyboardType="numeric"
          error={coordinateErrors.pickupLng}
        />
        <Input
          label="Destination latitude"
          value={destinationLat}
          onChangeText={setDestinationLat}
          keyboardType="numeric"
          error={coordinateErrors.destinationLat}
        />
        <Input
          label="Destination longitude"
          value={destinationLng}
          onChangeText={setDestinationLng}
          keyboardType="numeric"
          error={coordinateErrors.destinationLng}
        />
        <Button title="Request ride" onPress={handleRideRequest} loading={requesting} disabled={hasCoordinateError} />

        <View className="mt-5 rounded-2xl bg-slate-50 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900">Nearby riders preview</Text>
            {loadingNearby ? <ActivityIndicator color="#15803d" /> : null}
          </View>
          {nearbyRiders.length === 0 ? (
            <Text className="mt-3 text-sm text-slate-500">No riders detected yet. Try refreshing after riders go online.</Text>
          ) : (
            nearbyRiders.slice(0, 3).map((item, index) => (
              <View key={`${item.rider.phone}-${index}`} className="mt-3 rounded-2xl bg-white px-4 py-3">
                <Text className="font-semibold text-slate-800">{item.rider.bike_number}</Text>
                <Text className="text-sm text-slate-600">
                  {item.distance_km.toFixed(2)} km away · Rating {item.rider.rating}
                </Text>
              </View>
            ))
          )}
        </View>

        {activeRide ? (
          <View className="mt-5 rounded-2xl bg-brand-50 p-4">
            <Text className="text-base font-semibold capitalize text-brand-800">Ride status: {activeRide.status}</Text>
            <Text className="mt-1 text-sm text-brand-700">Fare: ₦{activeRide.fare}</Text>
            <Text className="mt-1 text-sm text-brand-700">Distance: {activeRide.distance_km.toFixed(2)} km</Text>
            <Text className="mt-1 text-sm text-brand-700">Rider ID: {activeRide.rider?.id ?? "Searching..."}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
};
