import axios from "axios";

// Create API instance with timeouts and proper error handling
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
export default api;
