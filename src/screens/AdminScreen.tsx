import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
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
  Save,
  ToggleOn,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/api";

const POST_ENDPOINT = `${API_BASE_URL}/api/posts`;
const EVENT_ENDPOINTS = [`${API_BASE_URL}/api/upcoming-events`, `${API_BASE_URL}/api/events`];

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
  isActive: boolean;
  createdAt?: string;
};

type Feedback = {
  severity: "success" | "error";
  message: string;
};

type PendingDelete =
  | { kind: "post"; item: Post }
  | { kind: "event"; item: UpcomingEvent }
  | null;

type ActiveView = "dashboard" | "posts" | "events";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
  { id: "posts", label: "Posts", icon: <LibraryBooks fontSize="small" /> },
  { id: "events", label: "Events", icon: <EventAvailable fontSize="small" /> },
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
  events: {
    title: "Upcoming Events",
    subtitle: "Create and review upcoming event records from the events API.",
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

const AdminScreen: React.FC = () => {
  const postFormRef = useRef<HTMLFormElement>(null);
  const eventFormRef = useRef<HTMLFormElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  const activeEvents = useMemo(() => events.filter((event) => event.isActive).length, [events]);
  const magazines = useMemo(() => posts.filter((post) => post.type === "Magazine").length, [posts]);
  const books = useMemo(() => posts.filter((post) => post.type === "Book").length, [posts]);
  const currentView = viewCopy[activeView];

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postPayload, eventPayload] = await Promise.all([
        requestJson<unknown>([POST_ENDPOINT], undefined, "Unable to load posts."),
        requestJson<unknown>(EVENT_ENDPOINTS, undefined, "Unable to load upcoming events."),
      ]);

      setPosts(normalizeCollection<Post>(postPayload));
      setEvents(normalizeCollection<UpcomingEvent>(eventPayload));
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
    loadAdminData();
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

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      title: String(formData.get("title") || "").trim(),
      isActive: formData.get("isActive") === "on",
    };

    if (!payload.title) {
      setFeedback({ severity: "error", message: "Event title is required." });
      return;
    }

    setIsSavingEvent(true);
    try {
      const createdEvent = await requestJson<UpcomingEvent>(
        EVENT_ENDPOINTS,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        "Unable to create upcoming event."
      );

      setEvents((currentEvents) => [createdEvent, ...currentEvents]);
      eventFormRef.current?.reset();
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

    await handleDeleteEvent(itemToDelete.item);
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

          {isLoading && <LinearProgress sx={{ bgcolor: "#eceff3", "& .MuiLinearProgress-bar": { bgcolor: "#caa64a" } }} />}

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
                { label: "Magazines", value: magazines, icon: <LibraryBooks /> },
                { label: "Books", value: books, icon: <AutoStories /> },
                { label: "Active events", value: activeEvents, icon: <ToggleOn /> },
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
                      <Typography sx={{ color: "#667085", fontSize: 13 }}>
                        {formatDate(event.createdAt)}
                      </Typography>
                    </Box>
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
          </Box>
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
