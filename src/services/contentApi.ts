import { API_BASE_URL } from "../config/api";

export const NEWS_ENDPOINT = `${API_BASE_URL}/api/news`;
export const POSTS_ENDPOINT = `${API_BASE_URL}/api/posts`;
export const PAST_EDITIONS_ENDPOINT = `${API_BASE_URL}/api/past-editions`;
export const TESTIMONIES_ENDPOINT = `${API_BASE_URL}/api/testimonies`;
export const INTERVIEWS_ENDPOINT = `${API_BASE_URL}/api/interviews`;
export const PHOTO_GALLERY_ENDPOINT = `${API_BASE_URL}/api/photo-gallery`;
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
  images?: string[];
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

const normalizeNewsItem = (item: NewsItem): NewsItem => ({
  ...item,
  description: item.description || item.desc || "",
  image: item.image || item.images?.[0] || "",
  images: Array.isArray(item.images) ? item.images : item.image ? [item.image] : [],
});

const normalizeEventItem = (item: EventItem): EventItem => ({
  ...item,
  description: item.description || item.desc || "",
  images: Array.isArray(item.images) ? item.images : [],
});

const normalizePostItem = (item: PostItem): PostItem => ({
  ...item,
  desc: item.desc || item.description || "",
  image: item.image || item.images?.[0] || "",
  images: Array.isArray(item.images) ? item.images : item.image ? [item.image] : [],
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

export const loadPosts = async () =>
  normalizeCollection<PostItem>(await requestJson<unknown>([POSTS_ENDPOINT], undefined, "Unable to load posts.")).map(
    normalizePostItem
  );

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
const COMMENTS_STORAGE_KEY = "reallife_public_comments";
const READER_STORAGE_KEY = "reallife_story_readers";

const getLocalComments = (): StoryComment[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(COMMENTS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as StoryComment[]) : [];
  } catch {
    return [];
  }
};

const saveLocalComments = (comments: StoryComment[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
};

const getLocalReaderCounts = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(READER_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
};

const saveLocalReaderCounts = (counts: Record<string, number>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(READER_STORAGE_KEY, JSON.stringify(counts));
};

const storyKey = (contentType: "post" | "news" | "event", contentId: string) => `${contentType}:${contentId}`;

export const loadStoryComments = async (contentType: "post" | "news" | "event", contentId: string) => {
  try {
    return await requestJson<StoryComment[]>(
      [`${COMMENTS_ENDPOINT}?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`],
      undefined,
      "Unable to load comments."
    );
  } catch {
    return getLocalComments().filter((item) => item.contentType === contentType && item.contentId === contentId);
  }
};

export const addStoryComment = async (
  contentType: "post" | "news" | "event",
  contentId: string,
  name: string,
  message: string
) => {
  try {
    return await requestJson<StoryComment>(
      [COMMENTS_ENDPOINT],
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId, name, message }),
      },
      "Unable to add comment."
    );
  } catch {
    const nextComment: StoryComment = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      contentType,
      contentId,
      name: name.trim(),
      message: message.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const comments = [nextComment, ...getLocalComments()];
    saveLocalComments(comments);
    return nextComment;
  }
};

export const toggleStoryCommentLike = async (commentId: string) => {
  try {
    return await requestJson<StoryComment>(
      [`${COMMENTS_ENDPOINT}/${commentId}/like`],
      { method: "POST" },
      "Unable to update like."
    );
  } catch {
    const comments = getLocalComments();
    const comment = comments.find((item) => item._id === commentId);
    if (!comment) {
      throw new Error("Comment not found.");
    }
    comment.likes = Math.max(0, (comment.likes || 0) + 1);
    saveLocalComments(comments);
    return comment;
  }
};

export const loadStoryReaders = async (contentType: "post" | "news" | "event", contentId: string) => {
  try {
    return await requestJson<StoryReadersPayload>(
      [`${READERS_ENDPOINT}/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`],
      undefined,
      "Unable to load reader count."
    );
  } catch {
    const key = storyKey(contentType, contentId);
    const counts = getLocalReaderCounts();
    return { contentType, contentId, readers: counts[key] || 0 };
  }
};

export const incrementStoryReaders = async (contentType: "post" | "news" | "event", contentId: string) => {
  try {
    return await requestJson<StoryReadersPayload>(
      [`${READERS_ENDPOINT}/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/increment`],
      { method: "POST" },
      "Unable to update reader count."
    );
  } catch {
    const key = storyKey(contentType, contentId);
    const counts = getLocalReaderCounts();
    const readers = (counts[key] || 0) + 1;
    counts[key] = readers;
    saveLocalReaderCounts(counts);
    return { contentType, contentId, readers };
  }
};
