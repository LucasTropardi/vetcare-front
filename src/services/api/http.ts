import axios from "axios";
import { API_BASE_URL } from "./endpoints";
import { authStore } from "../../store/auth.store";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const { accessToken, tokenType } = authStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `${tokenType ?? "Bearer"} ${accessToken}`;
  }
  return config;
});
