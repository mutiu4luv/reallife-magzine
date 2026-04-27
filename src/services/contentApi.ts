import { API_BASE_URL } from "../config/api";

export const NEWS_ENDPOINT = `${API_BASE_URL}/api/news`;
export const UPCOMING_EVENTS_ENDPOINTS = [
  `${API_BASE_URL}/api/upcoming-events`,
  `${API_BASE_URL}/api/events`,
];

export type NewsItem = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  desc?: string;
  image: string;
  createdAt?: string;
};

export type EventItem = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  desc?: string;
  images: string[];
  isActive?: boolean;
  createdAt?: string;
};

const normalizeNewsItem = (item: NewsItem): NewsItem => ({
  ...item,
  description: item.description || item.desc || "",
});

const normalizeEventItem = (item: EventItem): EventItem => ({
  ...item,
  description: item.description || item.desc || "",
  images: Array.isArray(item.images) ? item.images : [],
});

export const normalizeCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }

  return [];
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
};

export const requestJson = async <T,>(
  endpoints: string[],
  init?: RequestInit,
  fallback = "Request failed."
) => {
  let lastError = fallback;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, init);

      if (response.status === 404 && endpoint !== endpoints[endpoints.length - 1]) {
        lastError = await getErrorMessage(response, fallback);
        continue;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, fallback));
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (error) {
      lastError = error instanceof Error ? error.message : fallback;

      if (endpoint === endpoints[endpoints.length - 1]) {
        throw new Error(lastError);
      }
    }
  }

  throw new Error(lastError);
};

export const loadNews = async () =>
  normalizeCollection<NewsItem>(await requestJson<unknown>([NEWS_ENDPOINT], undefined, "Unable to load news.")).map(
    normalizeNewsItem
  );

export const loadNewsById = async (id: string) =>
  normalizeNewsItem(await requestJson<NewsItem>([`${NEWS_ENDPOINT}/${id}`], undefined, "Unable to load news item."));

export const loadUpcomingEvents = async () =>
  normalizeCollection<EventItem>(
    await requestJson<unknown>(UPCOMING_EVENTS_ENDPOINTS, undefined, "Unable to load upcoming events.")
  ).map(normalizeEventItem);

export const loadUpcomingEventById = async (id: string) =>
  normalizeEventItem(
    await requestJson<EventItem>(
      UPCOMING_EVENTS_ENDPOINTS.map((endpoint) => `${endpoint}/${id}`),
      undefined,
      "Unable to load upcoming event."
    )
  );
