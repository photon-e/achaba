export type UserRole = "customer" | "rider";

export interface RiderProfile {
  is_online: boolean;
  bike_number: string;
  phone: string;
  current_lat: number;
  current_lng: number;
  rating: string;
}

export interface User {
  id: number;
  phone_number: string;
  role: UserRole;
  rider_profile?: RiderProfile;
}

export interface Ride {
  id: number;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  status: "requested" | "accepted" | "ongoing" | "completed" | "cancelled";
  fare: string;
  distance_km: number;
  rider?: User;
  user?: User;
}

export interface AuthSession {
  token: string;
  user: User;
}
