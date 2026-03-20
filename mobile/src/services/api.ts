import axios from "axios";

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
