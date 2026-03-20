import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Switch, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { toggleRiderStatus } from "@/services/authService";
import { subscribeToRideChannel } from "@/services/firebaseService";
import { getApiErrorMessage } from "@/services/api";
import { acceptRide, completeRide, rideHistory, startRide } from "@/services/rideService";
import { Ride } from "@/types";
import { getCurrentCoordinates } from "@/utils/location";

export const RiderHomeScreen = () => {
  const { session, setSession } = useApp();
  const [isOnline, setIsOnline] = useState(session?.user.rider_profile?.is_online ?? false);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [history, setHistory] = useState<Ride[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const riderName = session?.user.phone_number ?? "Rider";
  const completedRides = useMemo(
    () => history.filter((ride) => ride.status === "completed").length,
    [history]
  );

  useEffect(() => {
    if (!session?.user.id) {
      return undefined;
    }

    return subscribeToRideChannel(`rider-${session.user.id}`, (payload) => {
      if (payload.ride_id) {
        setIncomingRide((currentRide) => ({
          id: Number(payload.ride_id),
          pickup_lat: currentRide?.pickup_lat ?? 6.5244,
          pickup_lng: currentRide?.pickup_lng ?? 3.3792,
          destination_lat: currentRide?.destination_lat ?? 6.6018,
          destination_lng: currentRide?.destination_lng ?? 3.3515,
          status: (typeof payload.status === "string" ? payload.status : "requested") as Ride["status"],
          fare: currentRide?.fare ?? "0.00",
          distance_km: currentRide?.distance_km ?? 0,
          rider: currentRide?.rider,
          user: currentRide?.user
        }));
      }
    });
  }, [session?.user.id]);

  const loadHistory = async (forceRefresh = false) => {
    setLoadingHistory(true);
    try {
      const rides = await rideHistory({ forceRefresh });
      setHistory(rides);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load ride history right now."));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory().catch(() => undefined);
  }, []);

  const syncAvailability = async (nextStatus: boolean) => {
    setBusy(true);
    setErrorMessage("");
    try {
      const coords = await getCurrentCoordinates();
      await toggleRiderStatus({
        is_online: nextStatus,
        current_lat: coords.latitude,
        current_lng: coords.longitude
      });
      setIsOnline(nextStatus);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Status update failed. Please check location permissions and your internet connection.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!incomingRide) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const response = await acceptRide(incomingRide.id);
      setIncomingRide(response.ride);
      await loadHistory(true);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Could not accept ride. It may have been taken already."));
    } finally {
      setBusy(false);
    }
  };

  const handleStartRide = async () => {
    if (!incomingRide) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const response = await startRide(incomingRide.id);
      setIncomingRide(response.ride);
      await loadHistory(true);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Could not start ride. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!incomingRide) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const response = await completeRide(incomingRide.id);
      setIncomingRide(response.ride);
      await loadHistory(true);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Could not complete ride. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="mb-5 rounded-[32px] bg-slate-900 p-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-white">Rider console</Text>
            <Text className="mt-2 text-base text-slate-300">{riderName}</Text>
          </View>
          <Button title="Logout" onPress={() => setSession(null)} variant="ghost" />
        </View>
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white/10 p-4">
            <Text className="text-sm text-slate-300">Availability</Text>
            <Text className="mt-1 text-xl font-bold text-white">{isOnline ? "Online" : "Offline"}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/10 p-4">
            <Text className="text-sm text-slate-300">Completed rides</Text>
            <Text className="mt-1 text-xl font-bold text-white">{completedRides}</Text>
          </View>
        </View>
      </View>

      {errorMessage ? (
        <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <Text className="text-sm text-rose-700">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Availability</Text>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-base text-slate-700">Go online to receive requests</Text>
            <Text className="mt-1 text-sm text-slate-500">
              Bike number: {session?.user.rider_profile?.bike_number ?? "Not provided"}
            </Text>
          </View>
          <Switch value={isOnline} onValueChange={syncAvailability} disabled={busy} />
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-slate-900">Incoming ride request</Text>
        {incomingRide ? (
          <>
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-600">Ride ID: {incomingRide.id}</Text>
              <Text className="mt-1 text-sm capitalize text-slate-600">Status: {incomingRide.status}</Text>
              <Text className="mt-1 text-sm text-slate-600">Fare: ₦{incomingRide.fare}</Text>
              <Text className="mt-1 text-sm text-slate-600">Distance: {incomingRide.distance_km.toFixed(2)} km</Text>
            </View>
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
              {incomingRide.status === "completed" ? (
                <Button title="Waiting for next ride" onPress={() => undefined} disabled variant="secondary" />
              ) : null}
            </View>
          </>
        ) : (
          <Text className="text-sm text-slate-500">
            No request yet. Turn on availability and wait for Firebase or mock notifications.
          </Text>
        )}
      </View>

      <View className="rounded-[28px] bg-white p-5 shadow-sm">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-slate-900">Ride history</Text>
          <Button title="Refresh" onPress={() => loadHistory(true)} variant="ghost" disabled={busy} />
        </View>
        {loadingHistory ? (
          <View className="flex-row items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <ActivityIndicator color="#15803d" />
            <Text className="text-sm text-slate-600">Loading your recent rides...</Text>
          </View>
        ) : history.length === 0 ? (
          <Text className="text-sm text-slate-500">Completed rides will appear here.</Text>
        ) : (
          history.slice(0, 5).map((ride) => (
            <View key={ride.id} className="mb-3 rounded-2xl bg-slate-50 p-4">
              <Text className="font-semibold text-slate-800">Ride #{ride.id}</Text>
              <Text className="text-sm capitalize text-slate-600">
                {ride.status} · ₦{ride.fare} · {ride.distance_km.toFixed(2)} km
              </Text>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
};
