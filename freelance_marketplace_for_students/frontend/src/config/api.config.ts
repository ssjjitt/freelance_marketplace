const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_URL || "http://localhost:8080"
);

export const API_WS_URL = API_BASE_URL;
