import { api } from "./api";
import { Ride } from "@/types";

export interface NearbyRider {
  rider: {
    is_online: boolean;
    bike_number: string;
    phone: string;
    current_lat: number;
    current_lng: number;
    rating: string;
  };
  distance_km: number;
}

export interface RequestRidePayload {
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
}

const nearbyCache = new Map<string, { timestamp: number; data: NearbyRider[] }>();
const nearbyInFlight = new Map<string, Promise<NearbyRider[]>>();
const historyCache = new Map<string, { timestamp: number; data: Ride[] }>();
const historyInFlight = new Map<string, Promise<Ride[]>>();
const NEARBY_TTL_MS = 30_000;
const HISTORY_TTL_MS = 15_000;
const HISTORY_CACHE_KEY = "ride-history";
const DEFAULT_POLL_INTERVAL_MS = 4_000;

const buildNearbyCacheKey = (lat: number, lng: number) => `${lat.toFixed(3)}:${lng.toFixed(3)}`;

const invalidateRideCaches = () => {
  historyCache.clear();
  nearbyCache.clear();
};

const areRidesEqual = (left?: Ride | null, right?: Ride | null) => {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return JSON.stringify(left) === JSON.stringify(right);
};

export const fetchNearbyRiders = async (
  lat: number,
  lng: number,
  options?: { forceRefresh?: boolean }
) => {
  const cacheKey = buildNearbyCacheKey(lat, lng);
  const cached = nearbyCache.get(cacheKey);
  const now = Date.now();

  if (!options?.forceRefresh && cached && now - cached.timestamp < NEARBY_TTL_MS) {
    return cached.data;
  }

  const inFlightRequest = nearbyInFlight.get(cacheKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = api
    .get("/rides/nearby-riders/", { params: { lat, lng } })
    .then((response) => {
      nearbyCache.set(cacheKey, { timestamp: Date.now(), data: response.data as NearbyRider[] });
      return response.data as NearbyRider[];
    })
    .finally(() => {
      nearbyInFlight.delete(cacheKey);
    });

  nearbyInFlight.set(cacheKey, request);
  return request;
};

export const requestRide = async (payload: RequestRidePayload) => {
  const response = await api.post("/rides/request/", payload);
  invalidateRideCaches();
  return response.data as { ride: Ride; auto_assigned_rider_id: number | null };
};

export const acceptRide = async (ride_id: number) => {
  const response = await api.post("/rides/accept/", { ride_id });
  invalidateRideCaches();
  return response.data as { ride: Ride };
};

export const startRide = async (ride_id: number) => {
  const response = await api.post("/rides/start/", { ride_id });
  invalidateRideCaches();
  return response.data as { ride: Ride };
};

export const completeRide = async (ride_id: number) => {
  const response = await api.post("/rides/complete/", { ride_id });
  invalidateRideCaches();
  return response.data as { ride: Ride };
};

export const rideHistory = async (options?: { forceRefresh?: boolean }) => {
  const cached = historyCache.get(HISTORY_CACHE_KEY);
  const now = Date.now();

  if (!options?.forceRefresh && cached && now - cached.timestamp < HISTORY_TTL_MS) {
    return cached.data;
  }

  const inFlightRequest = historyInFlight.get(HISTORY_CACHE_KEY);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = api
    .get("/rides/history/")
    .then((response) => {
      historyCache.set(HISTORY_CACHE_KEY, { timestamp: Date.now(), data: response.data as Ride[] });
      return response.data as Ride[];
    })
    .finally(() => {
      historyInFlight.delete(HISTORY_CACHE_KEY);
    });

  historyInFlight.set(HISTORY_CACHE_KEY, request);
  return request;
};

export const watchRideHistory = (
  selector: (rides: Ride[]) => Ride | null,
  onChange: (ride: Ride | null) => void,
  options?: { intervalMs?: number; onError?: (error: unknown) => void }
) => {
  let cancelled = false;
  let previousRide: Ride | null = null;

  const poll = async () => {
    try {
      const rides = await rideHistory({ forceRefresh: true });
      if (cancelled) {
        return;
      }

      const nextRide = selector(rides);
      if (!areRidesEqual(previousRide, nextRide)) {
        previousRide = nextRide;
        onChange(nextRide);
      }
    } catch (error) {
      options?.onError?.(error);
    }
  };

  poll().catch(() => undefined);
  const intervalId = setInterval(() => {
    poll().catch(() => undefined);
  }, options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
};
