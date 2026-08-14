import axios from "axios";
import i18n from "../i18n";
import { tokenService } from "./tokenService";
import { notifyUnauthorized } from "./authBridge";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await tokenService.getAccess();

  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = i18n.language || "ar";
  console.log({
    baseURL: config.baseURL,
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data,
  });
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    console.log(error.response?.data, "ssssss");
    if (status === 401 || status === 403) {
      await tokenService.clear();
      notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
