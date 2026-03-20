import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { subscribeToRideChannel } from "@/services/firebaseService";
import { requestRide } from "@/services/rideService";
import { getCurrentCoordinates } from "@/utils/location";

export const CustomerHomeScreen = () => {
  const { activeRide, session, setActiveRide, setSession } = useApp();
  const [pickupLat, setPickupLat] = useState("6.5244");
  const [pickupLng, setPickupLng] = useState("3.3792");
  const [destinationLat, setDestinationLat] = useState("6.6018");
  const [destinationLng, setDestinationLng] = useState("3.3515");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getCurrentCoordinates()
      .then((coords) => {
        setPickupLat(coords.latitude.toFixed(5));
        setPickupLng(coords.longitude.toFixed(5));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeRide) {
      return undefined;
    }

    return subscribeToRideChannel(`ride-${activeRide.id}`, (payload) => {
      if (payload.status) {
        setActiveRide({ ...activeRide, status: payload.status as any });
      }
    });
  }, [activeRide, setActiveRide]);

  const mapRegion = useMemo(
    () => ({
      latitude: Number(pickupLat),
      longitude: Number(pickupLng),
      latitudeDelta: 0.1,
      longitudeDelta: 0.1
    }),
    [pickupLat, pickupLng]
  );

  const handleRideRequest = async () => {
    setRequesting(true);
    try {
      const response = await requestRide({
        pickup_lat: Number(pickupLat),
        pickup_lng: Number(pickupLng),
        destination_lat: Number(destinationLat),
        destination_lng: Number(destinationLng)
      });
      setActiveRide(response.ride);
    } catch {
      Alert.alert("Request failed", "Please confirm the coordinates and try again.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Welcome</Text>
          <Text className="text-base text-slate-600">{session?.user.phone_number}</Text>
        </View>
        <Button title="Logout" onPress={() => setSession(null)} variant="secondary" />
      </View>

      <View className="mb-4 overflow-hidden rounded-3xl">
        <MapView style={{ height: 280 }} initialRegion={mapRegion} region={mapRegion}>
          <Marker coordinate={{ latitude: Number(pickupLat), longitude: Number(pickupLng) }} title="Pickup" />
          <Marker
            coordinate={{ latitude: Number(destinationLat), longitude: Number(destinationLng) }}
            title="Destination"
            pinColor="green"
          />
          <Polyline
            coordinates={[
              { latitude: Number(pickupLat), longitude: Number(pickupLng) },
              { latitude: Number(destinationLat), longitude: Number(destinationLng) }
            ]}
            strokeColor="#16a34a"
            strokeWidth={3}
          />
        </MapView>
      </View>

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Request an okada</Text>
        <Input label="Pickup latitude" value={pickupLat} onChangeText={setPickupLat} keyboardType="numeric" />
        <Input label="Pickup longitude" value={pickupLng} onChangeText={setPickupLng} keyboardType="numeric" />
        <Input
          label="Destination latitude"
          value={destinationLat}
          onChangeText={setDestinationLat}
          keyboardType="numeric"
        />
        <Input
          label="Destination longitude"
          value={destinationLng}
          onChangeText={setDestinationLng}
          keyboardType="numeric"
        />
        <Button title="Request ride" onPress={handleRideRequest} loading={requesting} />

        {activeRide ? (
          <View className="mt-5 rounded-2xl bg-slate-50 p-4">
            <Text className="text-base font-semibold text-slate-900">Ride status: {activeRide.status}</Text>
            <Text className="mt-1 text-sm text-slate-600">Fare: ₦{activeRide.fare}</Text>
            <Text className="mt-1 text-sm text-slate-600">
              Distance: {activeRide.distance_km.toFixed(2)} km
            </Text>
            <Text className="mt-1 text-sm text-slate-600">
              Rider ID: {activeRide.rider?.id ?? "Searching..."}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
};
