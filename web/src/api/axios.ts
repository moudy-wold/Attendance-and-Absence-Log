import axios from "axios";
import i18n from "../i18n";
import { tokenService } from "./tokenService";
import { notifyUnauthorized } from "./authBridge";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.getAccess();

  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = i18n.language || "ar";

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      tokenService.clear();
      notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
