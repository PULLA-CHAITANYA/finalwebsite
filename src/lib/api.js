import axios from "axios";

const api = axios.create({
  baseURL: "https://finalbackend-hherc0arefhubdbk.centralindia-01.azurewebsites.net/api",
  withCredentials: true,   // ensures cookies/session if backend ever uses them
  timeout: 10000,          // optional but good for Azure timeouts
  headers: {
    "Content-Type": "application/json"
  }
});

// attach Authorization header if token exists
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
