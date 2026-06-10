import { API_BASE_URL, DEPLOYED_API_BASE_URL, LOCAL_API_BASE_URL } from "../config/api";
import { getAuthHeaders } from "./authApi";

export const NEWS_ENDPOINT = `${API_BASE_URL}/api/news`;
export const POSTS_ENDPOINT = `${API_BASE_URL}/api/posts`;
export const MAGAZINES_ENDPOINT = `${API_BASE_URL}/api/magazines`;
export const PAST_EDITIONS_ENDPOINT = `${API_BASE_URL}/api/past-editions`;
export const TESTIMONIES_ENDPOINT = `${API_BASE_URL}/api/testimonies`;
export const INTERVIEWS_ENDPOINT = `${API_BASE_URL}/api/interviews`;
export const PHOTO_GALLERY_ENDPOINT = `${API_BASE_URL}/api/photo-gallery`;
export const COMPENDIUM_ENDPOINT = `${API_BASE_URL}/api/compendium`;
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
  images?: string[];
  createdAt?: string;
};

export type PostItem = {
  _id?: string;
  id?: string;
  title: string;
  type?: "Magazine" | "Book";
  desc?: string;
  description?: string;
  image: string;
  coverImage?: string;
  images?: string[];
  downloadUrl?: string;
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

export type PastEditionItem = {
  _id?: string;
  id?: string;
  title?: string;
  image: string;
  createdAt?: string;
};

export type TestimonyItem = {
  _id?: string;
  id?: string;
  name: string;
  message: string;
  image: string;
  isActive?: boolean;
  createdAt?: string;
};

export type InterviewItem = {
  _id?: string;
  id?: string;
  name: string;
  role: string;
  image: string;
  message?: string;
  qa: Array<{ question: string; answer: string }>;
  isActive?: boolean;
  createdAt?: string;
};

export type PhotoGalleryItem = {
  _id?: string;
  id?: string;
  title?: string;
  image: string;
  isActive?: boolean;
  createdAt?: string;
};

export type MagazinePageMeta = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type StoryComment = {
  _id: string;
  contentType: "post" | "news" | "event";
  contentId: string;
  name: string;
  message: string;
  likes: number;
  createdAt: string;
};

export type StoryReadersPayload = {
  contentType: "post" | "news" | "event";
  contentId: string;
  readers: number;
};

export type CompendiumMessageKind = "interview" | "tribute" | "goodwill" | "congratulatory";

export type CompendiumResponse = {
  prompt: string;
  answer: string;
};

export type CompendiumSubmission = {
  _id?: string;
  messageType: CompendiumMessageKind;
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  headline?: string;
  message?: string;
  advertRate?: string;
  responses?: CompendiumResponse[];
  createdAt?: string;
  updatedAt?: string;
};

const normalizeNewsItem = (item: NewsItem): NewsItem => ({
  ...item,
  description: item.description || item.desc || "",
  image: sanitizeImageUrl(item.image) || sanitizeImageUrl(item.images?.[0]) || "",
  images: sanitizeImageList(Array.isArray(item.images) ? item.images : item.image ? [item.image] : []),
});

const normalizeEventItem = (item: EventItem): EventItem => ({
  ...item,
  description: item.description || item.desc || "",
  images: sanitizeImageList(Array.isArray(item.images) ? item.images : []),
});

const normalizePostItem = (item: PostItem): PostItem => ({
  ...item,
  desc: item.desc || item.description || "",
  coverImage: sanitizeImageUrl(item.coverImage) || sanitizeImageUrl(item.image) || sanitizeImageUrl(item.images?.[0]) || "",
  image: sanitizeImageUrl(item.image) || sanitizeImageUrl(item.images?.[0]) || "",
  images: sanitizeImageList(Array.isArray(item.images) ? item.images : item.image ? [item.image] : []),
});

const sanitizeImageUrl = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.hostname === "x") return "";
    return raw;
  } catch {
    return "";
  }
};

const sanitizeImageList = (values: string[]) => values.map((item) => sanitizeImageUrl(item)).filter(Boolean);

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
  const expandedEndpoints = endpoints.flatMap((endpoint) => {
    if (!endpoint.startsWith(LOCAL_API_BASE_URL) || endpoint.startsWith(DEPLOYED_API_BASE_URL)) {
      return [endpoint];
    }
    const deployedEndpoint = endpoint.replace(LOCAL_API_BASE_URL, DEPLOYED_API_BASE_URL);
    return [endpoint, deployedEndpoint];
  });

  let lastError = fallback;

  for (const endpoint of expandedEndpoints) {
    try {
      const response = await fetch(endpoint, init);

      if (response.status === 404 && endpoint !== expandedEndpoints[expandedEndpoints.length - 1]) {
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

      if (endpoint === expandedEndpoints[expandedEndpoints.length - 1]) {
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

export const loadPosts = async () =>
  normalizeCollection<PostItem>(await requestJson<unknown>([POSTS_ENDPOINT], undefined, "Unable to load posts.")).map(
    normalizePostItem
  );

export const loadMagazines = async (page = 1, limit = 12) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await requestJson<{ data?: unknown; meta?: MagazinePageMeta }>(
    [`${MAGAZINES_ENDPOINT}?${query.toString()}`],
    undefined,
    "Unable to load magazines."
  );

  const items = normalizeCollection<PostItem>(response?.data).map(normalizePostItem);
  const meta = response?.meta || { page, limit, total: items.length, hasMore: false };

  return { items, meta };
};

export const loadPastEditions = async () =>
  normalizeCollection<PastEditionItem>(
    await requestJson<unknown>([PAST_EDITIONS_ENDPOINT], undefined, "Unable to load past editions.")
  );

export const loadTestimonies = async () =>
  normalizeCollection<TestimonyItem>(
    await requestJson<unknown>([TESTIMONIES_ENDPOINT], undefined, "Unable to load testimonies.")
  ).filter((item) => item.isActive !== false);

export const loadInterviews = async () =>
  normalizeCollection<InterviewItem>(
    await requestJson<unknown>([INTERVIEWS_ENDPOINT], undefined, "Unable to load interviews.")
  ).filter((item) => item.isActive !== false);

export const loadPhotoGallery = async () =>
  normalizeCollection<PhotoGalleryItem>(
    await requestJson<unknown>([PHOTO_GALLERY_ENDPOINT], undefined, "Unable to load photo gallery.")
  ).filter((item) => item.isActive !== false);

export const loadNewsById = async (id: string) =>
  normalizeNewsItem(await requestJson<NewsItem>([`${NEWS_ENDPOINT}/${id}`], undefined, "Unable to load news item."));

export const loadPostById = async (id: string) =>
  normalizePostItem(await requestJson<PostItem>([`${POSTS_ENDPOINT}/${id}`], undefined, "Unable to load post."));

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

const COMMENTS_ENDPOINT = `${API_BASE_URL}/api/comments`;
const READERS_ENDPOINT = `${API_BASE_URL}/api/readers`;

export const loadStoryComments = async (contentType: "post" | "news" | "event", contentId: string) => {
  return requestJson<StoryComment[]>(
    [`${COMMENTS_ENDPOINT}?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`],
    undefined,
    "Unable to load comments."
  );
};

export const addStoryComment = async (
  contentType: "post" | "news" | "event",
  contentId: string,
  name: string,
  message: string
) => {
  return requestJson<StoryComment>(
    [COMMENTS_ENDPOINT],
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, name, message }),
    },
    "Unable to add comment."
  );
};

export const toggleStoryCommentLike = async (commentId: string) => {
  return requestJson<StoryComment>(
    [`${COMMENTS_ENDPOINT}/${commentId}/like`],
    { method: "POST" },
    "Unable to update like."
  );
};

export const loadStoryReaders = async (contentType: "post" | "news" | "event", contentId: string) => {
  return requestJson<StoryReadersPayload>(
    [`${READERS_ENDPOINT}/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`],
    undefined,
    "Unable to load reader count."
  );
};

export const incrementStoryReaders = async (contentType: "post" | "news" | "event", contentId: string) => {
  return requestJson<StoryReadersPayload>(
    [`${READERS_ENDPOINT}/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/increment`],
    { method: "POST" },
    "Unable to update reader count."
  );
};

export const submitCompendiumMessage = async (payload: {
  messageType: CompendiumMessageKind;
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  headline?: string;
  message?: string;
  advertRate?: string;
  responses?: CompendiumResponse[];
}) =>
  requestJson<{ message: string; submission: CompendiumSubmission }>(
    [COMPENDIUM_ENDPOINT],
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Unable to submit commemorative message."
  );

export const loadCompendiumSubmissions = async () =>
  normalizeCollection<CompendiumSubmission>(
    await requestJson<unknown>(
      [COMPENDIUM_ENDPOINT],
      (() => {
        const headers = new Headers();
        Object.entries(getAuthHeaders()).forEach(([key, value]) => headers.set(key, value));
        return { headers };
      })(),
      "Unable to load commemorative submissions."
    )
  );
