import { useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { toggleRiderStatus } from "@/services/authService";
import { subscribeToRideChannel } from "@/services/firebaseService";
import { acceptRide, completeRide, rideHistory, startRide } from "@/services/rideService";
import { Ride } from "@/types";
import { getCurrentCoordinates } from "@/utils/location";

export const RiderHomeScreen = () => {
  const { session, setSession } = useApp();
  const [isOnline, setIsOnline] = useState(session?.user.rider_profile?.is_online ?? false);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [history, setHistory] = useState<Ride[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user.id) {
      return undefined;
    }
    return subscribeToRideChannel(`rider-${session.user.id}`, (payload) => {
      if (payload.ride_id) {
        setIncomingRide({
          id: Number(payload.ride_id),
          pickup_lat: 6.5244,
          pickup_lng: 3.3792,
          destination_lat: 6.6018,
          destination_lng: 3.3515,
          status: "requested",
          fare: "0.00",
          distance_km: 0
        });
      }
    });
  }, [session?.user.id]);

  useEffect(() => {
    rideHistory()
      .then(setHistory)
      .catch(() => undefined);
  }, []);

  const syncAvailability = async (nextStatus: boolean) => {
    setBusy(true);
    try {
      const coords = await getCurrentCoordinates();
      await toggleRiderStatus({
        is_online: nextStatus,
        current_lat: coords.latitude,
        current_lng: coords.longitude
      });
      setIsOnline(nextStatus);
    } catch {
      Alert.alert("Status update failed", "Please check location permissions and your internet connection.");
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!incomingRide) {
      return;
    }
    setBusy(true);
    try {
      const response = await acceptRide(incomingRide.id);
      setIncomingRide(response.ride);
    } catch {
      Alert.alert("Could not accept ride", "This ride may have been taken already.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartRide = async () => {
    if (!incomingRide) {
      return;
    }
    setBusy(true);
    try {
      const response = await startRide(incomingRide.id);
      setIncomingRide(response.ride);
    } catch {
      Alert.alert("Could not start ride", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!incomingRide) {
      return;
    }
    setBusy(true);
    try {
      const response = await completeRide(incomingRide.id);
      setIncomingRide(response.ride);
      const latestHistory = await rideHistory();
      setHistory(latestHistory);
    } catch {
      Alert.alert("Could not complete ride", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Rider console</Text>
          <Text className="text-base text-slate-600">{session?.user.phone_number}</Text>
        </View>
        <Button title="Logout" onPress={() => setSession(null)} variant="secondary" />
      </View>

      <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Availability</Text>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base text-slate-700">Go online to receive requests</Text>
            <Text className="text-sm text-slate-500">
              Bike number: {session?.user.rider_profile?.bike_number ?? "Not provided"}
            </Text>
          </View>
          <Switch value={isOnline} onValueChange={syncAvailability} disabled={busy} />
        </View>
      </View>

      <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Incoming ride request</Text>
        {incomingRide ? (
          <>
            <Text className="text-sm text-slate-600">Ride ID: {incomingRide.id}</Text>
            <Text className="mt-1 text-sm text-slate-600">Status: {incomingRide.status}</Text>
            <View className="mt-4 gap-3">
              {incomingRide.status === "requested" ? (
                <Button title="Accept ride" onPress={handleAcceptRide} loading={busy} />
              ) : null}
              {incomingRide.status === "accepted" ? (
                <Button title="Start ride" onPress={handleStartRide} loading={busy} />
              ) : null}
              {incomingRide.status === "ongoing" ? (
                <Button title="Complete ride" onPress={handleCompleteRide} loading={busy} />
              ) : null}
            </View>
          </>
        ) : (
          <Text className="text-sm text-slate-500">
            No request yet. Turn on availability and wait for Firebase/mock notifications.
          </Text>
        )}
      </View>

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Ride history</Text>
        {history.length === 0 ? (
          <Text className="text-sm text-slate-500">Completed rides will appear here.</Text>
        ) : (
          history.slice(0, 5).map((ride) => (
            <View key={ride.id} className="mb-3 rounded-2xl bg-slate-50 p-4">
              <Text className="font-semibold text-slate-800">Ride #{ride.id}</Text>
              <Text className="text-sm text-slate-600">
                {ride.status} · ₦{ride.fare} · {ride.distance_km.toFixed(2)} km
              </Text>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
};
