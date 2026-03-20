import axios, { AxiosError } from "axios";

import { ENV } from "@/config/env";

export const api = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 15000
});

export const setApiToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

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
    return error.message;
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
