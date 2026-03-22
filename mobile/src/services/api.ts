import axios, { AxiosError } from "axios";

import { ENV } from "@/config/env";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: normalizeBaseUrl(ENV.apiBaseUrl),
  timeout: 15000
});

export const setApiToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const isLocalApiBaseUrl = () => /https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?/i.test(api.defaults.baseURL ?? "");

export const getApiBaseUrl = () => api.defaults.baseURL ?? "";

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const detail = extractErrorDetail(error);
    return detail ?? fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const extractErrorDetail = (error: AxiosError) => {
  const { data } = error.response ?? {};

  if (!data) {
    return getNetworkErrorMessage(error);
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    const detail = Reflect.get(data, "detail");
    if (typeof detail === "string") {
      return detail;
    }

    for (const value of Object.values(data)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      if (typeof value === "string") {
        return value;
      }
    }
  }

  return undefined;
};

const getNetworkErrorMessage = (error: AxiosError) => {
  if (error.code === "ECONNABORTED") {
    return `The API at ${getApiBaseUrl()} took too long to respond. Make sure the backend server is running and reachable.`;
  }

  if (isLocalApiBaseUrl()) {
    return `Cannot reach ${getApiBaseUrl()}. If you are using Expo on a physical device, replace 127.0.0.1/localhost with your computer's local network IP in EXPO_PUBLIC_API_BASE_URL.`;
  }

  return error.message;
};
