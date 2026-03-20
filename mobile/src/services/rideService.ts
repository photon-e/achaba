import { api } from "./api";
import { Ride } from "@/types";

export interface RequestRidePayload {
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
}

export const fetchNearbyRiders = async (lat: number, lng: number) => {
  const response = await api.get("/rides/nearby-riders/", { params: { lat, lng } });
  return response.data;
};

export const requestRide = async (payload: RequestRidePayload) => {
  const response = await api.post("/rides/request/", payload);
  return response.data as { ride: Ride; auto_assigned_rider_id: number | null };
};

export const acceptRide = async (ride_id: number) => {
  const response = await api.post("/rides/accept/", { ride_id });
  return response.data as { ride: Ride };
};

export const startRide = async (ride_id: number) => {
  const response = await api.post("/rides/start/", { ride_id });
  return response.data as { ride: Ride };
};

export const completeRide = async (ride_id: number) => {
  const response = await api.post("/rides/complete/", { ride_id });
  return response.data as { ride: Ride };
};

export const rideHistory = async () => {
  const response = await api.get("/rides/history/");
  return response.data as Ride[];
};
