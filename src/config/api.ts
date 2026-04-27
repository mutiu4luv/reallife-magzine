const DEPLOYED_API_BASE_URL = "https://reallife-magzine-backend.vercel.app";
const LOCAL_API_BASE_URL = "http://localhost:5000";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isLocalApiBaseUrl = (url: string) =>
  /\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url);

export const API_BASE_URL =
  configuredApiBaseUrl &&
  !(import.meta.env.PROD && isLocalApiBaseUrl(configuredApiBaseUrl))
    ? configuredApiBaseUrl
    : import.meta.env.DEV
    ? LOCAL_API_BASE_URL
    : DEPLOYED_API_BASE_URL;
