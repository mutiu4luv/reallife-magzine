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
  MenuItem,
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
  Save,
  ToggleOn,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/api";
import { NEWS_ENDPOINT } from "../services/contentApi";

const POST_ENDPOINT = `${API_BASE_URL}/api/posts`;
const EVENT_ENDPOINTS = [`${API_BASE_URL}/api/upcoming-events`, `${API_BASE_URL}/api/events`];
const CONTACT_ENDPOINTS = [
  `${API_BASE_URL}/api/contact`,
  `${API_BASE_URL}/api/contact-messages`,
  `${API_BASE_URL}/api/contactMessages`,
];
const DATABASE_READY_RETRY_DELAYS = [700, 1400, 2400];

type PostType = "Magazine" | "Book";

type Post = {
  _id?: string;
  title: string;
  type: PostType;
  desc: string;
  image: string;
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

type Feedback = {
  severity: "success" | "error";
  message: string;
};

type PendingDelete =
  | { kind: "post"; item: Post }
  | { kind: "news"; item: NewsItem }
  | { kind: "event"; item: UpcomingEvent }
  | null;

type ActiveView = "dashboard" | "posts" | "news" | "events" | "messages";

type RequestJsonOptions = {
  retryDatabaseReady?: boolean;
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
  { id: "posts", label: "Posts", icon: <LibraryBooks fontSize="small" /> },
  { id: "news", label: "News", icon: <Article fontSize="small" /> },
  { id: "events", label: "Events", icon: <EventAvailable fontSize="small" /> },
  { id: "messages", label: "Messages", icon: <Mail fontSize="small" /> },
] satisfies Array<{ id: ActiveView; label: string; icon: React.ReactNode }>;

const viewCopy: Record<ActiveView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Admin Dashboard",
    subtitle: "Track posts, magazines, books, and active upcoming events.",
  },
  posts: {
    title: "Posts",
    subtitle: "Create and review magazine or book posts from the posts API.",
  },
  news: {
    title: "News",
    subtitle: "Upload news with an image, title, and description.",
  },
  events: {
    title: "Upcoming Events",
    subtitle: "Upload upcoming events with multiple images, title, and description.",
  },
  messages: {
    title: "Contact Messages",
    subtitle: "Review messages submitted from the website contact form.",
  },
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
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
          Loading posts, events, and database records.
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedNewsImageName, setSelectedNewsImageName] = useState("");
  const [selectedEventImageNames, setSelectedEventImageNames] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  const activeEvents = useMemo(() => events.filter((event) => event.isActive).length, [events]);
  const magazines = useMemo(() => posts.filter((post) => post.type === "Magazine").length, [posts]);
  const books = useMemo(() => posts.filter((post) => post.type === "Book").length, [posts]);
  const currentView = viewCopy[activeView];

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postPayload, eventPayload, messagePayload, newsPayload] = await Promise.all([
        requestJson<unknown>([POST_ENDPOINT], undefined, "Unable to load posts."),
        requestJson<unknown>(EVENT_ENDPOINTS, undefined, "Unable to load upcoming events."),
        requestJson<unknown>(CONTACT_ENDPOINTS, undefined, "Unable to load contact messages."),
        requestJson<unknown>([NEWS_ENDPOINT], undefined, "Unable to load news.").catch(() => []),
      ]);

      setPosts(normalizeCollection<Post>(postPayload));
      setNews(normalizeCollection<NewsItem>(newsPayload));
      setEvents(normalizeCollection<UpcomingEvent>(eventPayload));
      setMessages(normalizeCollection<ContactMessage>(messagePayload));
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to load admin data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadAdminData]);

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const image = formData.get("image");
    const title = String(formData.get("title") || "").trim();
    const desc = String(formData.get("desc") || "").trim();
    const type = String(formData.get("type") || "Magazine") as PostType;

    if (!title || !desc || !(image instanceof File) || image.size === 0) {
      setFeedback({ severity: "error", message: "Title, description, and cover image are required." });
      return;
    }

    formData.set("title", title);
    formData.set("desc", desc);
    formData.set("type", type);

    setIsSavingPost(true);
    try {
      const createdPost = await requestJson<Post>(
        [POST_ENDPOINT],
        {
          method: "POST",
          body: formData,
        },
        "Unable to publish post."
      );

      setPosts((currentPosts) => [createdPost, ...currentPosts]);
      postFormRef.current?.reset();
      setSelectedImageName("");
      setFeedback({ severity: "success", message: "Post published successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to publish post.",
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

    if (!title || !description || !(image instanceof File) || image.size === 0) {
      setFeedback({ severity: "error", message: "News title, description, and image are required." });
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
    const imageFiles = formData.getAll("images").filter((image) => image instanceof File && image.size > 0);

    if (!title || !description || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Event title, description, and at least one image are required." });
      return;
    }

    formData.set("title", title);
    formData.set("description", description);
    formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");

    setIsSavingEvent(true);
    try {
      const createdEvent = await requestJson<UpcomingEvent>(
        EVENT_ENDPOINTS,
        {
          method: "POST",
          body: formData,
        },
        "Unable to create upcoming event."
      );

      setEvents((currentEvents) => [createdEvent, ...currentEvents]);
      eventFormRef.current?.reset();
      setSelectedEventImageNames("");
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

  const handleDeletePost = async (post: Post) => {
    if (!post._id) {
      setFeedback({ severity: "error", message: "This post cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(post._id);
    setFeedback({ severity: "success", message: `Deleting "${post.title}"...` });
    try {
      await requestJson<{ message: string }>(
        [`${POST_ENDPOINT}/${post._id}`],
        { method: "DELETE" },
        "Unable to delete post."
      );

      setPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost._id !== post._id));
      setFeedback({ severity: "success", message: "Post deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete post.",
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
                { label: "Published posts", value: posts.length, icon: <Article /> },
                { label: "News", value: news.length, icon: <Article /> },
                { label: "Magazines", value: magazines, icon: <LibraryBooks /> },
                { label: "Books", value: books, icon: <AutoStories /> },
                { label: "Active events", value: activeEvents, icon: <ToggleOn /> },
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

          {(activeView === "posts" || activeView === "news" || activeView === "events") && (
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
                      Create Post
                    </Typography>
                  </Box>
                  <Chip size="small" label="Post API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="Title" name="title" fullWidth />

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
                    Select cover image
                    <input
                      hidden
                      required
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        setSelectedImageName(changeEvent.target.files?.[0]?.name || "");
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedImageName || "No image selected"}
                  </Typography>
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
                  {isSavingPost ? "Publishing..." : "Publish post"}
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
                    Select news image
                    <input
                      hidden
                      required
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        setSelectedNewsImageName(changeEvent.target.files?.[0]?.name || "");
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedNewsImageName || "No image selected"}
                  </Typography>
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
                    Select event images
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
                        setSelectedEventImageNames(names);
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedEventImageNames || "No images selected"}
                  </Typography>
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
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Recent Posts
              </Typography>
              <Stack spacing={1.5}>
                {posts.slice(0, 5).map((post) => (
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
                      {post.image ? (
                        <Box component="img" src={post.image} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

                {!posts.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No posts returned from the API yet.</Typography>
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "news" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Recent News
              </Typography>
              <Stack spacing={1.5}>
                {news.slice(0, 8).map((newsItem) => (
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

                {!news.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No news returned from the API yet.</Typography>
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "events" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Upcoming Events
              </Typography>
              <Stack spacing={1.25}>
                {events.slice(0, 6).map((event) => (
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

                {!events.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No upcoming events returned from the API yet.</Typography>
                )}
              </Stack>
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
