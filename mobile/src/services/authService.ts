import { api } from "./api";
import { AuthSession } from "@/types";

export interface RegisterPayload {
  phone_number: string;
  role: "customer" | "rider";
  password: string;
  bike_number?: string;
}

export const register = async (payload: RegisterPayload): Promise<AuthSession> => {
  const response = await api.post("/auth/register/", payload);
  return response.data;
};

export const requestOtp = async (phone_number: string) => {
  const response = await api.post("/auth/otp/request/", { phone_number });
  return response.data as { phone_number: string; otp_code: string; message: string };
};

export const verifyOtp = async (phone_number: string, otp_code: string): Promise<AuthSession> => {
  const response = await api.post("/auth/otp/verify/", { phone_number, otp_code });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/me/");
  return response.data;
};

export const toggleRiderStatus = async (payload: {
  is_online: boolean;
  current_lat: number;
  current_lng: number;
}) => {
  const response = await api.post("/auth/rider/toggle-status/", payload);
  return response.data;
};
