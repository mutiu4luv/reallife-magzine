import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  Article,
  AutoStories,
  CloudUpload,
  Dashboard,
  Delete,
  EventAvailable,
  Image,
  LibraryBooks,
  Mail,
  PhotoLibrary,
  Save,
  Search,
  ToggleOn,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/api";
import { NEWS_ENDPOINT, PAST_EDITIONS_ENDPOINT } from "../services/contentApi";

const POST_ENDPOINT = `${API_BASE_URL}/api/posts`;
const EVENT_ENDPOINTS = [`${API_BASE_URL}/api/upcoming-events`, `${API_BASE_URL}/api/events`];
const CONTACT_ENDPOINTS = [
  `${API_BASE_URL}/api/contact`,
  `${API_BASE_URL}/api/contact-messages`,
  `${API_BASE_URL}/api/contactMessages`,
];
const DATABASE_READY_RETRY_DELAYS = [700, 1400, 2400];
const MAX_EVENT_IMAGES = 8;
const MAX_IMAGE_SIZE_BYTES = 1.2 * 1024 * 1024;
const MAX_EVENT_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "1.2MB";
const MAX_EVENT_TOTAL_UPLOAD_LABEL = "4MB";
const ADMIN_PAGE_SIZE = 6;

type PostType = "Magazine" | "Book";

type Post = {
  _id?: string;
  title: string;
  type: PostType;
  desc: string;
  image: string;
  images?: string[];
  createdAt?: string;
};

type UpcomingEvent = {
  _id?: string;
  title: string;
  description?: string;
  images?: string[];
  isActive: boolean;
  createdAt?: string;
};

type NewsItem = {
  _id?: string;
  title: string;
  description: string;
  image: string;
  createdAt?: string;
};

type ContactMessage = {
  _id?: string;
  fullName: string;
  email: string;
  message: string;
  createdAt?: string;
};

type PastEdition = {
  _id?: string;
  title?: string;
  image: string;
  createdAt?: string;
};

type Feedback = {
  severity: "success" | "error";
  message: string;
};

type PendingDelete =
  | { kind: "post"; item: Post }
  | { kind: "news"; item: NewsItem }
  | { kind: "event"; item: UpcomingEvent }
  | { kind: "pastEdition"; item: PastEdition }
  | null;

type ActiveView = "dashboard" | "posts" | "news" | "events" | "pastEditions" | "messages";

type RequestJsonOptions = {
  retryDatabaseReady?: boolean;
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
  { id: "posts", label: "Blog", icon: <LibraryBooks fontSize="small" /> },
  { id: "news", label: "News", icon: <Article fontSize="small" /> },
  { id: "events", label: "Events", icon: <EventAvailable fontSize="small" /> },
  { id: "pastEditions", label: "Past Editions", icon: <PhotoLibrary fontSize="small" /> },
  { id: "messages", label: "Messages", icon: <Mail fontSize="small" /> },
] satisfies Array<{ id: ActiveView; label: string; icon: React.ReactNode }>;

const viewCopy: Record<ActiveView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Admin Dashboard",
    subtitle: "Track blog articles, magazines, books, and active upcoming events.",
  },
  posts: {
    title: "Blog",
    subtitle: "Create and review blog articles, magazines, and books.",
  },
  news: {
    title: "News",
    subtitle: "Upload news with an image, title, and description.",
  },
  events: {
    title: "Upcoming Events",
    subtitle: "Upload upcoming events with multiple images, title, and description.",
  },
  pastEditions: {
    title: "Past Editions",
    subtitle: "Upload images that appear in the homepage past edition section.",
  },
  messages: {
    title: "Contact Messages",
    subtitle: "Review messages submitted from the website contact form.",
  },
};

const getErrorMessage = async (response: Response, fallback: string) => {
  if (response.status === 413) {
    return "The selected images are too large for Vercel. Please choose smaller images or upload fewer images.";
  }

  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data?.error || data?.message || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
};
const wait = (delay: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });

const isDatabaseReadinessError = (message: string) =>
  message.toLowerCase().includes("database is not ready");

const toAdminErrorMessage = (message: string) =>
  isDatabaseReadinessError(message)
    ? "The database is still starting. Please wait a moment and refresh again."
    : message;

const isUsableImageFile = (value: FormDataEntryValue | null): value is File =>
  value instanceof File && value.size > 0 && value.type.startsWith("image/");

const getLargeImageNames = (files: File[]) =>
  files.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES).map((file) => file.name);

const getTotalFileSize = (files: File[]) =>
  files.reduce((total, file) => total + file.size, 0);

const buildTotalUploadTooLargeMessage = () =>
  `The selected images are too large for Vercel upload. Please choose smaller images with a total size below ${MAX_EVENT_TOTAL_UPLOAD_LABEL}.`;

const buildLargeImageMessage = (names: string[]) =>
  names.length === 1
    ? `${names[0]} is larger than ${MAX_IMAGE_SIZE_LABEL}. Please choose a smaller image.`
    : `${names.length} selected images are larger than ${MAX_IMAGE_SIZE_LABEL}. Please choose smaller images.`;

const normalizeCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }

  return [];
};

const requestCollection = async <T,>(endpoints: string[], fallback: string) => {
  try {
    return {
      items: normalizeCollection<T>(await requestJson<unknown>(endpoints, undefined, fallback)),
      error: "",
    };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : fallback,
    };
  }
};

const requestJson = async <T,>(
  endpoints: string[],
  init?: RequestInit,
  fallback = "Request failed.",
  options: RequestJsonOptions = {}
) => {
  let lastError = fallback;
  const isReadRequest = !init?.method || init.method.toUpperCase() === "GET";
  const canRetryDatabaseReady = options.retryDatabaseReady ?? isReadRequest;

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt <= DATABASE_READY_RETRY_DELAYS.length; attempt += 1) {
      try {
        const response = await fetch(endpoint, init);

        if (response.status === 404 && endpoint !== endpoints[endpoints.length - 1]) {
          lastError = await getErrorMessage(response, fallback);
          break;
        }

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, fallback));
        }

        const text = await response.text();
        return (text ? JSON.parse(text) : undefined) as T;
      } catch (error) {
        lastError = error instanceof Error ? error.message : fallback;
        const shouldRetryDatabaseReady =
          canRetryDatabaseReady &&
          isDatabaseReadinessError(lastError) &&
          attempt < DATABASE_READY_RETRY_DELAYS.length;

        if (shouldRetryDatabaseReady) {
          await wait(DATABASE_READY_RETRY_DELAYS[attempt]);
          continue;
        }

        if (endpoint === endpoints[endpoints.length - 1]) {
          throw new Error(toAdminErrorMessage(lastError));
        }

        break;
      }
    }
  }

  throw new Error(toAdminErrorMessage(lastError));
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getSearchText = (values: Array<string | undefined>) =>
  values.join(" ").toLowerCase();

const filterByQuery = <T,>(items: T[], query: string, getValues: (item: T) => Array<string | undefined>) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => getSearchText(getValues(item)).includes(normalizedQuery));
};

const getPageCount = (total: number) => Math.max(Math.ceil(total / ADMIN_PAGE_SIZE), 1);

const paginateItems = <T,>(items: T[], page: number) =>
  items.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

const AdminLoader = () => (
  <Paper
    elevation={0}
    sx={{
      position: "relative",
      overflow: "hidden",
      minHeight: { xs: 280, md: 360 },
      border: "1px solid #e6e8ec",
      borderRadius: 2,
      bgcolor: "#111318",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      px: 3,
      isolation: "isolate",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: -160,
        background:
          "radial-gradient(circle at 30% 30%, rgba(202,166,74,0.34), transparent 32%), radial-gradient(circle at 70% 62%, rgba(96,165,250,0.22), transparent 34%)",
        animation: "adminLoaderGlow 5.5s ease-in-out infinite alternate",
        zIndex: -2,
      },
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 34%, rgba(255,255,255,0.04))",
        zIndex: -1,
      },
      "@keyframes adminLoaderGlow": {
        "0%": { transform: "translate3d(-3%, -2%, 0) scale(1)" },
        "100%": { transform: "translate3d(3%, 2%, 0) scale(1.08)" },
      },
      "@keyframes adminLoaderPulse": {
        "0%, 100%": { opacity: 0.42, transform: "scaleX(0.72)" },
        "50%": { opacity: 1, transform: "scaleX(1)" },
      },
    }}
  >
    <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center", maxWidth: 420 }}>
      <Box sx={{ position: "relative", width: 112, height: 112, display: "grid", placeItems: "center" }}>
        <CircularProgress
          size={108}
          thickness={2.6}
          sx={{ position: "absolute", color: "#caa64a" }}
        />
        <CircularProgress
          size={82}
          thickness={2.2}
          variant="determinate"
          value={74}
          sx={{ position: "absolute", color: "rgba(255,255,255,0.26)", transform: "rotate(142deg)" }}
        />
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "#caa64a",
            color: "#111318",
            boxShadow: "0 16px 44px rgba(0,0,0,0.28)",
          }}
        >
          <AutoStories />
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1.1, fontWeight: 900 }}>
          Preparing admin studio
        </Typography>
        <Typography sx={{ color: "#cbd5e1", mt: 1, fontSize: 15 }}>
          Loading blog articles, events, and database records.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, width: 172, justifyContent: "center" }} aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <Box
            key={item}
            sx={{
              width: 46,
              height: 4,
              borderRadius: 999,
              bgcolor: item === 1 ? "#caa64a" : "rgba(255,255,255,0.36)",
              transformOrigin: "center",
              animation: `adminLoaderPulse 1.2s ease-in-out ${item * 0.16}s infinite`,
            }}
          />
        ))}
      </Box>
    </Stack>
  </Paper>
);

const AdminScreen: React.FC = () => {
  const postFormRef = useRef<HTMLFormElement>(null);
  const newsFormRef = useRef<HTMLFormElement>(null);
  const eventFormRef = useRef<HTMLFormElement>(null);
  const pastEditionFormRef = useRef<HTMLFormElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [pastEditions, setPastEditions] = useState<PastEdition[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingPastEdition, setIsSavingPastEdition] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedBlogImageNames, setSelectedBlogImageNames] = useState("");
  const [selectedPastEditionImageNames, setSelectedPastEditionImageNames] = useState("");
  const [selectedNewsImageName, setSelectedNewsImageName] = useState("");
  const [selectedNewsImagePreview, setSelectedNewsImagePreview] = useState("");
  const [selectedEventImages, setSelectedEventImages] = useState<File[]>([]);
  const [selectedEventImageNames, setSelectedEventImageNames] = useState("");
  const [selectedEventImageCount, setSelectedEventImageCount] = useState(0);
  const [selectedEventImagePreviews, setSelectedEventImagePreviews] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [postSearch, setPostSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [postPage, setPostPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  const activeEvents = useMemo(() => events.filter((event) => event.isActive).length, [events]);
  const magazines = useMemo(() => posts.filter((post) => post.type === "Magazine").length, [posts]);
  const books = useMemo(() => posts.filter((post) => post.type === "Book").length, [posts]);
  const filteredPosts = useMemo(
    () => filterByQuery(posts, postSearch, (post) => [post.title, post.desc, post.type, post.createdAt]),
    [postSearch, posts]
  );
  const filteredNews = useMemo(
    () => filterByQuery(news, newsSearch, (newsItem) => [newsItem.title, newsItem.description, newsItem.createdAt]),
    [news, newsSearch]
  );
  const filteredEvents = useMemo(
    () => filterByQuery(events, eventSearch, (event) => [event.title, event.description, event.createdAt]),
    [eventSearch, events]
  );
  const postPageCount = useMemo(() => getPageCount(filteredPosts.length), [filteredPosts.length]);
  const newsPageCount = useMemo(() => getPageCount(filteredNews.length), [filteredNews.length]);
  const eventPageCount = useMemo(() => getPageCount(filteredEvents.length), [filteredEvents.length]);
  const visiblePosts = useMemo(() => paginateItems(filteredPosts, postPage), [filteredPosts, postPage]);
  const visibleNews = useMemo(() => paginateItems(filteredNews, newsPage), [filteredNews, newsPage]);
  const visibleEvents = useMemo(() => paginateItems(filteredEvents, eventPage), [eventPage, filteredEvents]);
  const currentView = viewCopy[activeView];

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    const [postResult, eventResult, messageResult, newsResult, pastEditionResult] = await Promise.all([
      requestCollection<Post>([POST_ENDPOINT], "Unable to load blogs."),
      requestCollection<UpcomingEvent>(EVENT_ENDPOINTS, "Unable to load upcoming events."),
      requestCollection<ContactMessage>(CONTACT_ENDPOINTS, "Unable to load contact messages."),
      requestCollection<NewsItem>([NEWS_ENDPOINT], "Unable to load news."),
      requestCollection<PastEdition>([PAST_EDITIONS_ENDPOINT], "Unable to load past editions."),
    ]);

    setPosts(postResult.items);
    setNews(newsResult.items);
    setEvents(eventResult.items);
    setMessages(messageResult.items);
    setPastEditions(pastEditionResult.items);

    const failedSections = [
      postResult.error && "blogs",
      eventResult.error && "events",
      messageResult.error && "messages",
      newsResult.error && "news",
      pastEditionResult.error && "past editions",
    ].filter(Boolean);

    if (failedSections.length > 0) {
      setFeedback({
        severity: "error",
        message: `Could not load ${failedSections.join(", ")}. Showing only data returned from the backend.`,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadAdminData]);

  useEffect(() => {
    return () => {
      if (selectedNewsImagePreview) {
        URL.revokeObjectURL(selectedNewsImagePreview);
      }
    };
  }, [selectedNewsImagePreview]);

  useEffect(() => {
    return () => {
      selectedEventImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedEventImagePreviews]);

  useEffect(() => {
    setPostPage(1);
  }, [postSearch]);

  useEffect(() => {
    setNewsPage(1);
  }, [newsSearch]);

  useEffect(() => {
    setEventPage(1);
  }, [eventSearch]);

  useEffect(() => {
    setPostPage((page) => Math.min(page, postPageCount));
  }, [postPageCount]);

  useEffect(() => {
    setNewsPage((page) => Math.min(page, newsPageCount));
  }, [newsPageCount]);

  useEffect(() => {
    setEventPage((page) => Math.min(page, eventPageCount));
  }, [eventPageCount]);

  const handleNewsImageChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0];

    if (selectedNewsImagePreview) {
      URL.revokeObjectURL(selectedNewsImagePreview);
    }

    if (!file) {
      setSelectedNewsImageName("");
      setSelectedNewsImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      changeEvent.target.value = "";
      setSelectedNewsImageName("");
      setSelectedNewsImagePreview("");
      setFeedback({ severity: "error", message: "Please choose an image file." });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      changeEvent.target.value = "";
      setSelectedNewsImageName("");
      setSelectedNewsImagePreview("");
      setFeedback({ severity: "error", message: buildLargeImageMessage([file.name]) });
      return;
    }

    setSelectedNewsImageName(file.name);
    setSelectedNewsImagePreview(URL.createObjectURL(file));
  };

  const updateEventImageState = (images: File[]) => {
    selectedEventImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
  
    setSelectedEventImages(images);
    setSelectedEventImageNames(images.map((file) => file.name).join(", "));
    setSelectedEventImageCount(images.length);
    setSelectedEventImagePreviews(images.map((file) => URL.createObjectURL(file)));
  };
  
  const handleEventImagesChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(changeEvent.target.files || []);
  
    if (selectedFiles.length === 0) {
      return;
    }
  
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
  
    if (imageFiles.length === 0) {
      changeEvent.target.value = "";
      setFeedback({ severity: "error", message: "Please choose image files only." });
      return;
    }
  
    const largeImageNames = getLargeImageNames(imageFiles);
  
    if (largeImageNames.length > 0) {
      changeEvent.target.value = "";
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }
  
    const combinedImages = [...selectedEventImages, ...imageFiles];
  
    const uniqueImages = combinedImages.filter(
      (file, index, self) =>
        index ===
        self.findIndex(
          (currentFile) =>
            currentFile.name === file.name &&
            currentFile.size === file.size &&
            currentFile.lastModified === file.lastModified
        )
    );
  
    const limitedImages = uniqueImages.slice(0, MAX_EVENT_IMAGES);

    const totalUploadSize = getTotalFileSize(limitedImages);
    
    if (totalUploadSize > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      changeEvent.target.value = "";
      setFeedback({
        severity: "error",
        message: buildTotalUploadTooLargeMessage(),
      });
      return;
    }
    
    if (uniqueImages.length > MAX_EVENT_IMAGES) {
      setFeedback({
        severity: "error",
        message: `Only ${MAX_EVENT_IMAGES} event images can be uploaded.`,
      });
    } else {
      setFeedback(null);
    }
    
    updateEventImageState(limitedImages);
    
    changeEvent.target.value = "";
  };

  const handleRemoveEventImage = (imageIndex: number) => {
    const remainingImages = selectedEventImages.filter((_, index) => index !== imageIndex);
    updateEventImageState(remainingImages);
  };

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const imageFiles = formData.getAll("images").filter(isUsableImageFile);
    const title = String(formData.get("title") || "").trim();
    const desc = String(formData.get("desc") || "").trim();
    const type = String(formData.get("type") || "Magazine") as PostType;

    if (!title || !desc || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Blog title, description, and at least one image are required." });
      return;
    }

    const largeImageNames = getLargeImageNames(imageFiles);
    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    const buildBlogFormData = () => {
      const blogFormData = new FormData();
      blogFormData.set("title", title);
      blogFormData.set("desc", desc);
      blogFormData.set("type", type);
      blogFormData.set("image", imageFiles[0]);

      return blogFormData;
    };

    setIsSavingPost(true);
    try {
      const createdPost = await requestJson<Post>(
        [POST_ENDPOINT],
        {
          method: "POST",
          body: buildBlogFormData(),
        },
        "Unable to publish blog."
      );

      setPosts((currentPosts) => [createdPost, ...currentPosts]);
      postFormRef.current?.reset();
      setSelectedBlogImageNames("");
      setFeedback({ severity: "success", message: "Blog published successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to publish blog.",
      });
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleNewsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const image = formData.get("image");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!title || !description || !isUsableImageFile(image)) {
      setFeedback({ severity: "error", message: "News title, description, and image are required." });
      return;
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      setFeedback({ severity: "error", message: buildLargeImageMessage([image.name]) });
      return;
    }

    formData.set("title", title);
    formData.set("description", description);

    setIsSavingNews(true);
    try {
      const createdNews = await requestJson<NewsItem>(
        [NEWS_ENDPOINT],
        {
          method: "POST",
          body: formData,
        },
        "Unable to publish news."
      );

      setNews((currentNews) => [createdNews, ...currentNews]);
      newsFormRef.current?.reset();
      setSelectedNewsImageName("");
      setSelectedNewsImagePreview("");
      setFeedback({ severity: "success", message: "News published successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to publish news.",
      });
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const imageFiles = selectedEventImages;
    if (!title || !description || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Event title, description, and at least one image are required." });
      return;
    }

    const uploadableEventImages = imageFiles.slice(0, MAX_EVENT_IMAGES);
    const largeImageNames = getLargeImageNames(uploadableEventImages);
    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }
    if (getTotalFileSize(uploadableEventImages) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      setFeedback({
        severity: "error",
        message: buildTotalUploadTooLargeMessage(),
      });
      return;
    }

    formData.set("title", title);
    formData.set("description", description);
    formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");

    const eventFormData = new FormData();
    eventFormData.set("title", title);
    eventFormData.set("description", description);
    eventFormData.set("isActive", formData.get("isActive") === "true" ? "true" : "false");
    uploadableEventImages.forEach((image) => {
      eventFormData.append("images", image);
    });

    setIsSavingEvent(true);
    try {
      const createdEvent = await requestJson<UpcomingEvent>(
        [`${API_BASE_URL}/api/upcoming-events`, `${API_BASE_URL}/api/events`],
        {
          method: "POST",
          body: eventFormData,
        },
        "Unable to create upcoming event."
      );

      setEvents((currentEvents) => [createdEvent, ...currentEvents]);
      eventFormRef.current?.reset();
      selectedEventImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setSelectedEventImages([]);
      setSelectedEventImageNames("");
      setSelectedEventImageCount(0);
      setSelectedEventImagePreviews([]);
      setFeedback({ severity: "success", message: "Upcoming event created successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to create upcoming event.",
      });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handlePastEditionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const imageFiles = formData.getAll("images").filter(isUsableImageFile);

    if (imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Choose at least one past edition image." });
      return;
    }

    const uploadableImages = imageFiles.slice(0, MAX_EVENT_IMAGES);
    const largeImageNames = getLargeImageNames(uploadableImages);

    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    if (getTotalFileSize(uploadableImages) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      setFeedback({ severity: "error", message: buildTotalUploadTooLargeMessage() });
      return;
    }

    const pastEditionFormData = new FormData();
    pastEditionFormData.set("title", title);
    uploadableImages.forEach((image) => {
      pastEditionFormData.append("images", image);
    });

    setIsSavingPastEdition(true);
    try {
      const createdEditions = await requestJson<PastEdition[]>(
        [PAST_EDITIONS_ENDPOINT],
        {
          method: "POST",
          body: pastEditionFormData,
        },
        "Unable to upload past edition images."
      );

      setPastEditions((currentEditions) => [...createdEditions, ...currentEditions]);
      pastEditionFormRef.current?.reset();
      setSelectedPastEditionImageNames("");
      setFeedback({ severity: "success", message: "Past edition image uploaded successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to upload past edition images.",
      });
    } finally {
      setIsSavingPastEdition(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!post._id) {
      setFeedback({ severity: "error", message: "This blog cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(post._id);
    setFeedback({ severity: "success", message: `Deleting "${post.title}"...` });
    try {
      await requestJson<{ message: string }>(
        [`${POST_ENDPOINT}/${post._id}`],
        { method: "DELETE" },
        "Unable to delete blog."
      );

      setPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost._id !== post._id));
      setFeedback({ severity: "success", message: "Blog deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete blog.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    const itemToDelete = pendingDelete;
    setPendingDelete(null);

    if (!itemToDelete) {
      return;
    }

    if (itemToDelete.kind === "post") {
      await handleDeletePost(itemToDelete.item);
      return;
    }

    if (itemToDelete.kind === "news") {
      await handleDeleteNews(itemToDelete.item);
      return;
    }

    if (itemToDelete.kind === "pastEdition") {
      await handleDeletePastEdition(itemToDelete.item);
      return;
    }

    await handleDeleteEvent(itemToDelete.item);
  };

  const handleDeleteNews = async (newsItem: NewsItem) => {
    if (!newsItem._id) {
      setFeedback({ severity: "error", message: "This news item cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(newsItem._id);
    setFeedback({ severity: "success", message: `Deleting "${newsItem.title}"...` });
    try {
      await requestJson<{ message: string }>(
        [`${NEWS_ENDPOINT}/${newsItem._id}`],
        { method: "DELETE" },
        "Unable to delete news."
      );

      setNews((currentNews) => currentNews.filter((currentItem) => currentItem._id !== newsItem._id));
      setFeedback({ severity: "success", message: "News deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete news.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteEvent = async (eventItem: UpcomingEvent) => {
    if (!eventItem._id) {
      setFeedback({ severity: "error", message: "This event cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(eventItem._id);
    setFeedback({ severity: "success", message: `Deleting "${eventItem.title}"...` });
    try {
      await requestJson<{ message: string }>(
        EVENT_ENDPOINTS.map((endpoint) => `${endpoint}/${eventItem._id}`),
        { method: "DELETE" },
        "Unable to delete upcoming event."
      );

      setEvents((currentEvents) => currentEvents.filter((currentEvent) => currentEvent._id !== eventItem._id));
      setFeedback({ severity: "success", message: "Upcoming event deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete upcoming event.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePastEdition = async (edition: PastEdition) => {
    if (!edition._id) {
      setFeedback({ severity: "error", message: "This past edition image cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(edition._id);
    setFeedback({ severity: "success", message: "Deleting past edition image..." });
    try {
      await requestJson<{ message: string }>(
        [`${PAST_EDITIONS_ENDPOINT}/${edition._id}`],
        { method: "DELETE" },
        "Unable to delete past edition image."
      );

      setPastEditions((currentEditions) => currentEditions.filter((currentEdition) => currentEdition._id !== edition._id));
      setFeedback({ severity: "success", message: "Past edition image deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete past edition image.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 272 },
          flexShrink: 0,
          bgcolor: "#111318",
          color: "#fff",
          px: { xs: 1.25, md: 2.5 },
          py: { xs: 1.25, md: 3 },
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: { xs: "auto", md: "100vh" },
          borderRight: { xs: 0, md: "1px solid rgba(255,255,255,0.08)" },
          borderBottom: { xs: "1px solid rgba(255,255,255,0.08)", md: 0 },
        }}
      >
        <Stack
          spacing={{ xs: 1.25, md: 3 }}
          sx={{
            height: "100%",
            flexDirection: { xs: "row", md: "column" },
            alignItems: { xs: "center", md: "stretch" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: { xs: 38, md: 42 },
                height: { xs: 38, md: 42 },
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "#caa64a",
                color: "#111318",
                mb: { xs: 0, md: 1.5 },
              }}
            >
              <AutoStories />
            </Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                RealityLife
              </Typography>
              <Typography sx={{ color: "#9da4af", fontSize: 13 }}>
                Content Admin
              </Typography>
            </Box>
          </Box>

          <Stack
            spacing={{ xs: 0.75, md: 1 }}
            direction={{ xs: "row", md: "column" }}
            sx={{
              flex: { xs: 1, md: "initial" },
              minWidth: 0,
              overflowX: { xs: "auto", md: "visible" },
              pb: { xs: 0.25, md: 0 },
            }}
          >
            {navItems.map((item) => {
              const isActive = activeView === item.id;

              return (
              <Button
                key={item.label}
                onClick={() => setActiveView(item.id)}
                startIcon={item.icon}
                sx={{
                  justifyContent: { xs: "center", md: "flex-start" },
                  minWidth: { xs: "max-content", md: 0 },
                  px: 1.5,
                  py: { xs: 0.95, md: 1.2 },
                  color: isActive ? "#111318" : "#d8dde5",
                  bgcolor: isActive ? "#caa64a" : "transparent",
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  "& .MuiButton-startIcon": { m: "0 8px 0 0" },
                  "&:hover": { bgcolor: isActive ? "#d4b45a" : "rgba(255,255,255,0.08)" },
                }}
              >
                {item.label}
              </Button>
              );
            })}
          </Stack>

          <Box sx={{ mt: "auto", display: { xs: "none", md: "block" } }}>
            <Typography sx={{ color: "#9da4af", fontSize: 13 }}>
              API base
            </Typography>
            <Typography sx={{ color: "#fff", fontSize: 13, wordBreak: "break-word" }}>
              {API_BASE_URL}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#171a20" }}>
                {currentView.title}
              </Typography>
              <Typography sx={{ color: "#667085", mt: 0.5 }}>
                {currentView.subtitle}
              </Typography>
            </Box>

            <Button
              onClick={loadAdminData}
              variant="outlined"
              sx={{
                borderColor: "#caa64a",
                color: "#6f5517",
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "#fff",
              }}
            >
              Refresh data
            </Button>
          </Box>

          {isLoading ? (
            <AdminLoader />
          ) : (
            <>
          {activeView === "dashboard" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {[
                { label: "Published blogs", value: posts.length, icon: <Article /> },
                { label: "News", value: news.length, icon: <Article /> },
                { label: "Magazines", value: magazines, icon: <LibraryBooks /> },
                { label: "Books", value: books, icon: <AutoStories /> },
                { label: "Active events", value: activeEvents, icon: <ToggleOn /> },
                { label: "Past edition images", value: pastEditions.length, icon: <PhotoLibrary /> },
                { label: "Contact messages", value: messages.length, icon: <Mail /> },
              ].map((item) => (
                <Paper key={item.label} elevation={0} sx={{ p: 2.25, border: "1px solid #e6e8ec", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                    <Box>
                      <Typography sx={{ color: "#667085", fontSize: 14, fontWeight: 700 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: "#171a20", fontSize: 32, lineHeight: 1.1, fontWeight: 900 }}>
                        {item.value}
                      </Typography>
                    </Box>
                    <Box sx={{ color: "#caa64a", display: "grid", placeItems: "center" }}>{item.icon}</Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {(activeView === "posts" || activeView === "news" || activeView === "events" || activeView === "pastEditions") && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 3,
              alignItems: "start",
            }}
          >
            {activeView === "posts" && (
            <Paper
              ref={postFormRef}
              component="form"
              onSubmit={handlePostSubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Add sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Create Blog
                    </Typography>
                  </Box>
                  <Chip size="small" label="Blog API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="Blog title" name="title" fullWidth />

                <TextField select required label="Type" name="type" defaultValue="Magazine" fullWidth>
                  <MenuItem value="Magazine">Magazine</MenuItem>
                  <MenuItem value="Book">Book</MenuItem>
                </TextField>

                <TextField required multiline minRows={5} label="Description" name="desc" fullWidth />

                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: "#caa64a",
                      color: "#6f5517",
                      textTransform: "none",
                      fontWeight: 900,
                      "&:hover": { borderColor: "#caa64a", bgcolor: "#f7edd0" },
                    }}
                  >
                    Select blog image
                    <input
                      hidden
                      required
                      multiple
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        const names = Array.from(changeEvent.target.files || [])
                          .map((file) => file.name)
                          .join(", ");
                        setSelectedBlogImageNames(names);
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedBlogImageNames || "No image selected"}
                  </Typography>
                  {selectedBlogImageNames.includes(",") && (
                    <Typography sx={{ color: "#b45309", fontSize: 13, mt: 0.5 }}>
                      The current backend accepts one blog image, so only the first selected image will be uploaded.
                    </Typography>
                  )}
                </Box>

                <Button
                  type="submit"
                  disabled={isSavingPost}
                  startIcon={<Save />}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#111318",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 900,
                    px: 3,
                    "&:hover": { bgcolor: "#2a2f38" },
                  }}
                >
                  {isSavingPost ? "Publishing..." : "Publish blog"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "news" && (
            <Paper
              ref={newsFormRef}
              component="form"
              onSubmit={handleNewsSubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Article sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Create News
                    </Typography>
                  </Box>
                  <Chip size="small" label="News API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="News title" name="title" fullWidth />

                <TextField required multiline minRows={5} label="Description" name="description" fullWidth />

                <Box
                  component="label"
                  sx={{
                    cursor: "pointer",
                    border: "1.5px dashed #caa64a",
                    borderRadius: 2,
                    bgcolor: "#fffaf0",
                    minHeight: { xs: 220, sm: 260 },
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    position: "relative",
                    transition: "border-color 160ms ease, background-color 160ms ease",
                    "&:hover": {
                      borderColor: "#9a7725",
                      bgcolor: "#fff4d9",
                    },
                  }}
                >
                  <input
                    hidden
                    required
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleNewsImageChange}
                  />
                  {selectedNewsImagePreview ? (
                    <>
                      <Box
                        component="img"
                        src={selectedNewsImagePreview}
                        alt="Selected news"
                        sx={{ width: "100%", height: "100%", minHeight: { xs: 220, sm: 260 }, objectFit: "cover" }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          left: 12,
                          right: 12,
                          bottom: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          bgcolor: "rgba(17,19,24,0.86)",
                          color: "#fff",
                          borderRadius: 1.5,
                          px: 1.5,
                          py: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 800, minWidth: 0 }} noWrap>
                          {selectedNewsImageName}
                        </Typography>
                        <Button
                          component="span"
                          size="small"
                          startIcon={<CloudUpload />}
                          sx={{ color: "#f7edd0", textTransform: "none", fontWeight: 900, flexShrink: 0 }}
                        >
                          Change
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center", px: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1.5,
                          bgcolor: "#caa64a",
                          color: "#111318",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <CloudUpload />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 900, color: "#171a20" }}>
                          Upload news image
                        </Typography>
                        <Typography sx={{ color: "#667085", fontSize: 13, mt: 0.5 }}>
                          Click here and choose an image from your device. Max {MAX_IMAGE_SIZE_LABEL}.
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Box>

                <Button
                  type="submit"
                  disabled={isSavingNews}
                  startIcon={<Save />}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#111318",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 900,
                    px: 3,
                    "&:hover": { bgcolor: "#2a2f38" },
                  }}
                >
                  {isSavingNews ? "Publishing..." : "Publish news"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "events" && (
            <Paper
              ref={eventFormRef}
              component="form"
              onSubmit={handleEventSubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <EventAvailable sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Upcoming Event
                    </Typography>
                  </Box>
                  <Chip size="small" label="Event API" sx={{ bgcolor: "#eef4ff", color: "#175cd3", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="Event title" name="title" fullWidth />

                <TextField required multiline minRows={5} label="Description" name="description" fullWidth />

                <Box
                  component="label"
                  sx={{
                    cursor: "pointer",
                    border: "1.5px dashed #caa64a",
                    borderRadius: 2,
                    bgcolor: "#fffaf0",
                    minHeight: { xs: 260, sm: 300 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 1.5,
                    p: { xs: 1.5, sm: 2 },
                    transition: "border-color 160ms ease, background-color 160ms ease",
                    "&:hover": {
                      borderColor: "#9a7725",
                      bgcolor: "#fff4d9",
                    },
                  }}
                >
                  <input
  hidden
  required={selectedEventImages.length === 0}
  multiple
  type="file"
  name="images"
  accept="image/*"
  onChange={handleEventImagesChange}
/>

                  {selectedEventImagePreviews.length > 0 ? (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                          },
                          gap: 1,
                        }}
                      >
                        {selectedEventImagePreviews.map((preview, index) => (
  <Box
    key={preview}
    sx={{
      position: "relative",
      aspectRatio: index === 0 ? { xs: "1 / 1", sm: "2 / 1" } : "1 / 1",
      gridColumn: index === 0 ? { xs: "span 2", sm: "span 2" } : "span 1",
      borderRadius: 1.5,
      overflow: "hidden",
      bgcolor: "#111318",
    }}
  >
    <Box
      component="img"
      src={preview}
      alt={`Selected event image ${index + 1}`}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />

    <IconButton
      size="small"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleRemoveEventImage(index);
      }}
      sx={{
        position: "absolute",
        top: 6,
        right: 6,
        bgcolor: "rgba(0,0,0,0.7)",
        color: "#fff",
        "&:hover": {
          bgcolor: "#b42318",
        },
      }}
    >
      <Delete fontSize="small" />
    </IconButton>
  </Box>
))}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                          gap: 1.5,
                          flexDirection: { xs: "column", sm: "row" },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: "#171a20" }}>
                            {selectedEventImageCount} image{selectedEventImageCount === 1 ? "" : "s"} ready
                          </Typography>
                          <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                            {selectedEventImageNames}
                          </Typography>
                        </Box>
                        <Button
                          component="span"
                          size="small"
                          startIcon={<CloudUpload />}
                          sx={{ color: "#6f5517", textTransform: "none", fontWeight: 900, flexShrink: 0 }}
                        >
                          Change images
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center", px: 2 }}>
                      <Box
                        sx={{
                          width: 58,
                          height: 58,
                          borderRadius: 1.5,
                          bgcolor: "#caa64a",
                          color: "#111318",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <PhotoLibrary />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 900, color: "#171a20" }}>
                          Upload event images
                        </Typography>
                        <Typography sx={{ color: "#667085", fontSize: 13, mt: 0.5 }}>
                          Choose up to {MAX_EVENT_IMAGES} images. Each image must be {MAX_IMAGE_SIZE_LABEL} or smaller.
                        </Typography>
                      </Box>
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        sx={{
                          borderColor: "#caa64a",
                          color: "#6f5517",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { borderColor: "#caa64a", bgcolor: "#f7edd0" },
                        }}
                      >
                        Select images
                      </Button>
                    </Stack>
                  )}
                </Box>

                <FormControlLabel
                  control={<Checkbox name="isActive" defaultChecked sx={{ color: "#caa64a", "&.Mui-checked": { color: "#caa64a" } }} />}
                  label="Show this event as active"
                />

                <Button
                  type="submit"
                  disabled={isSavingEvent}
                  startIcon={<Save />}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#caa64a",
                    color: "#111318",
                    textTransform: "none",
                    fontWeight: 900,
                    px: 3,
                    "&:hover": { bgcolor: "#d4b45a" },
                  }}
                >
                  {isSavingEvent ? "Saving..." : "Create event"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "pastEditions" && (
            <Paper
              ref={pastEditionFormRef}
              component="form"
              onSubmit={handlePastEditionSubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <PhotoLibrary sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Add Past Edition Images
                    </Typography>
                  </Box>
                  <Chip size="small" label="Past Editions API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                {/* <TextField label="Image title" name="title" fullWidth /> */}

                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: "#caa64a",
                      color: "#6f5517",
                      textTransform: "none",
                      fontWeight: 900,
                      "&:hover": { borderColor: "#caa64a", bgcolor: "#f7edd0" },
                    }}
                  >
                    Select past edition images
                    <input
                      hidden
                      required
                      multiple
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        const files = Array.from(changeEvent.target.files || []);
                        const names = files.slice(0, MAX_EVENT_IMAGES).map((file) => file.name).join(", ");
                        setSelectedPastEditionImageNames(names);

                        if (files.length > MAX_EVENT_IMAGES) {
                          setFeedback({
                            severity: "error",
                            message: `Only ${MAX_EVENT_IMAGES} past edition images can be uploaded at once.`,
                          });
                        }
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedPastEditionImageNames || "No image selected"}
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  disabled={isSavingPastEdition}
                  startIcon={<Save />}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#111318",
                    color: "#fff",
                    textTransform: "none",
                    fontWeight: 900,
                    px: 3,
                    "&:hover": { bgcolor: "#2a2f38" },
                  }}
                >
                  {isSavingPastEdition ? "Uploading..." : "Upload images"}
                </Button>
              </Stack>
            </Paper>
            )}
          </Box>
          )}

          {activeView !== "dashboard" && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 3,
              alignItems: "start",
            }}
          >
            {activeView === "posts" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexDirection: { xs: "column", md: "row" },
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Recent Blogs
                </Typography>
                <TextField
                  size="small"
                  value={postSearch}
                  onChange={(event) => setPostSearch(event.target.value)}
                  placeholder="Search blogs"
                  sx={{ minWidth: { xs: "100%", md: 280 } }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
              <Stack spacing={1.5}>
                {visiblePosts.map((post) => (
                  <Box
                    key={post._id || `${post.title}-${post.createdAt}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "56px 1fr", sm: "56px 1fr auto auto" },
                      gap: 1.5,
                      alignItems: "center",
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 1,
                        bgcolor: "#f2f4f7",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        color: "#98a2b3",
                      }}
                    >
                      {post.image || post.images?.[0] ? (
                        <Box component="img" src={post.image || post.images?.[0]} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Image />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                        {post.title}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                        {post.desc}
                      </Typography>
                    </Box>
                    <Chip size="small" label={post.type} sx={{ fontWeight: 800 }} />
                    <Button
                      onClick={() => setPendingDelete({ kind: "post", item: post })}
                      disabled={deletingId === post._id}
                      startIcon={<Delete />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#b42318",
                        border: "1px solid #fda29b",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                ))}

                {!filteredPosts.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>
                    {posts.length ? "No blogs match your search." : "No blogs returned from the API yet."}
                  </Typography>
                )}

                {filteredPosts.length > ADMIN_PAGE_SIZE && (
                  <Pagination
                    count={postPageCount}
                    page={postPage}
                    onChange={(_, page) => setPostPage(page)}
                    sx={{ alignSelf: "center", pt: 1 }}
                  />
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "news" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexDirection: { xs: "column", md: "row" },
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Recent News
                </Typography>
                <TextField
                  size="small"
                  value={newsSearch}
                  onChange={(event) => setNewsSearch(event.target.value)}
                  placeholder="Search news"
                  sx={{ minWidth: { xs: "100%", md: 280 } }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
              <Stack spacing={1.5}>
                {visibleNews.map((newsItem) => (
                  <Box
                    key={newsItem._id || `${newsItem.title}-${newsItem.createdAt}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "64px 1fr", sm: "64px 1fr auto" },
                      gap: 1.5,
                      alignItems: "center",
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 1,
                        bgcolor: "#f2f4f7",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        color: "#98a2b3",
                      }}
                    >
                      {newsItem.image ? (
                        <Box component="img" src={newsItem.image} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Image />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                        {newsItem.title}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                        {newsItem.description}
                      </Typography>
                    </Box>
                    <Button
                      onClick={() => setPendingDelete({ kind: "news", item: newsItem })}
                      disabled={deletingId === newsItem._id}
                      startIcon={<Delete />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#b42318",
                        border: "1px solid #fda29b",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                ))}

                {!filteredNews.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>
                    {news.length ? "No news match your search." : "No news returned from the API yet."}
                  </Typography>
                )}

                {filteredNews.length > ADMIN_PAGE_SIZE && (
                  <Pagination
                    count={newsPageCount}
                    page={newsPage}
                    onChange={(_, page) => setNewsPage(page)}
                    sx={{ alignSelf: "center", pt: 1 }}
                  />
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "events" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexDirection: { xs: "column", md: "row" },
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Upcoming Events
                </Typography>
                <TextField
                  size="small"
                  value={eventSearch}
                  onChange={(changeEvent) => setEventSearch(changeEvent.target.value)}
                  placeholder="Search events"
                  sx={{ minWidth: { xs: "100%", md: 280 } }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
              <Stack spacing={1.25}>
                {visibleEvents.map((event) => (
                  <Box
                    key={event._id || `${event.title}-${event.createdAt}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                        {event.title}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                        {event.description || formatDate(event.createdAt)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${event.images?.length || 0} images`}
                      sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 900 }}
                    />
                      <Chip
                        size="small"
                        label={event.isActive ? "Active" : "Hidden"}
                      sx={{
                        fontWeight: 900,
                        bgcolor: event.isActive ? "#ecfdf3" : "#f2f4f7",
                        color: event.isActive ? "#027a48" : "#667085",
                      }}
                    />
                    <IconButton
                      aria-label={`Delete ${event.title}`}
                      onClick={() => setPendingDelete({ kind: "event", item: event })}
                      disabled={deletingId === event._id}
                      sx={{
                        color: "#b42318",
                        border: "1px solid #fda29b",
                        borderRadius: 1.25,
                        "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                {!filteredEvents.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>
                    {events.length ? "No events match your search." : "No upcoming events returned from the API yet."}
                  </Typography>
                )}

                {filteredEvents.length > ADMIN_PAGE_SIZE && (
                  <Pagination
                    count={eventPageCount}
                    page={eventPage}
                    onChange={(_, page) => setEventPage(page)}
                    sx={{ alignSelf: "center", pt: 1 }}
                  />
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "pastEditions" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                  flexDirection: { xs: "column", md: "row" },
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Past Edition Images
                </Typography>
                <Chip
                  size="small"
                  label={`${pastEditions.length} total`}
                  sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.5,
                }}
              >
                {pastEditions.map((edition, index) => (
                  <Box
                    key={edition._id || `${edition.image}-${index}`}
                    sx={{
                      position: "relative",
                      aspectRatio: "3 / 4",
                      overflow: "hidden",
                      borderRadius: 1.5,
                      bgcolor: "#111318",
                    }}
                  >
                    <Box
                      component="img"
                      src={edition.image}
                      alt={edition.title || `Past edition ${index + 1}`}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <IconButton
                      aria-label="Delete past edition image"
                      onClick={() => setPendingDelete({ kind: "pastEdition", item: edition })}
                      disabled={deletingId === edition._id}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(0,0,0,0.72)",
                        color: "#fff",
                        "&:hover": { bgcolor: "#b42318" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              {!pastEditions.length && !isLoading && (
                <Typography sx={{ color: "#667085" }}>No past edition images returned from the API yet.</Typography>
              )}
            </Paper>
            )}

            {activeView === "messages" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                  flexDirection: { xs: "column", md: "row" },
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Contact Messages
                </Typography>
                <Chip
                  size="small"
                  label={`${messages.length} total`}
                  sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }}
                />
              </Box>

              <Stack spacing={1.5}>
                {messages.map((messageItem) => (
                  <Box
                    key={messageItem._id || `${messageItem.email}-${messageItem.createdAt}`}
                    sx={{
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: { xs: 1.5, md: 2 },
                      bgcolor: "#fff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        gap: 1.5,
                        flexDirection: { xs: "column", md: "row" },
                        mb: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, color: "#171a20", overflowWrap: "anywhere" }}>
                          {messageItem.fullName}
                        </Typography>
                        <Typography sx={{ color: "#667085", fontSize: 13, overflowWrap: "anywhere" }}>
                          {messageItem.email}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#98a2b3", fontSize: 13, flexShrink: 0 }}>
                        {formatDate(messageItem.createdAt)}
                      </Typography>
                    </Box>

                    <Typography sx={{ color: "#475467", lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {messageItem.message}
                    </Typography>
                  </Box>
                ))}

                {!messages.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No contact messages returned from the API yet.</Typography>
                )}
              </Stack>
            </Paper>
            )}
          </Box>
          )}
            </>
          )}
        </Stack>
      </Box>
      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback?.severity || "success"}
          onClose={() => setFeedback(null)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete item?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#475467" }}>
            Do you want to delete "{pendingDelete?.item.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setPendingDelete(null)}
            sx={{ color: "#475467", textTransform: "none", fontWeight: 800 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            autoFocus
            startIcon={<Delete />}
            sx={{
              bgcolor: "#b42318",
              color: "#fff",
              textTransform: "none",
              fontWeight: 900,
              "&:hover": { bgcolor: "#912018" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminScreen;
