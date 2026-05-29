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
  AdminPanelSettings,
  Article,
  AutoStories,
  CloudUpload,
  Dashboard,
  Delete,
  Edit,
  EventAvailable,
  Image,
  LibraryBooks,
  Logout,
  Mail,
  PhotoLibrary,
  Save,
  Search,
  Share,
  ToggleOn,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  INTERVIEWS_ENDPOINT,
  NEWS_ENDPOINT,
  PAST_EDITIONS_ENDPOINT,
  PHOTO_GALLERY_ENDPOINT,
  TESTIMONIES_ENDPOINT,
} from "../services/contentApi";
import { shareContent } from "../utils/share";
import { useAuth } from "../context/useAuth";
import {
  getAuthHeaders,
  hasPermission,
  loadAuditLogs,
  loadAdminRequests,
  loadPermissionRequests,
  loadUsers,
  deleteUser,
  resolveAdminRequest,
  resolvePermissionRequest,
  updateUserRole,
} from "../services/authApi";
import type { AuditLog, AuthUser, Permission } from "../services/authApi";

const POST_ENDPOINT = `${API_BASE_URL}/api/posts`;
const DELETED_POSTS_ENDPOINT = `${API_BASE_URL}/api/posts/deleted/list`;
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
const MAX_INTERVIEW_QA = 6;

type PostType = "Magazine" | "Book";

type Post = {
  _id?: string;
  title: string;
  type: PostType;
  desc: string;
  image: string;
  images?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: { name?: string; email?: string; role?: string };
  editHistory?: Array<{ editedAt?: string; editedBy?: { name?: string; email?: string; role?: string } }>;
  createdAt?: string;
};

type UpcomingEvent = {
  _id?: string;
  id?: string;
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
  images?: string[];
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

type Testimony = {
  _id?: string;
  name: string;
  message: string;
  image: string;
  isActive?: boolean;
  createdAt?: string;
};

type Interview = {
  _id?: string;
  name: string;
  role: string;
  image: string;
  message?: string;
  qa: Array<{ question: string; answer: string }>;
  isActive?: boolean;
  createdAt?: string;
};

type GalleryPhoto = {
  _id?: string;
  title?: string;
  image: string;
  isActive?: boolean;
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
  | { kind: "testimony"; item: Testimony }
  | { kind: "interview"; item: Interview }
  | { kind: "galleryPhoto"; item: GalleryPhoto }
  | null;

type PendingEdit =
  | { kind: "post"; item: Post }
  | { kind: "news"; item: NewsItem }
  | { kind: "event"; item: UpcomingEvent }
  | { kind: "testimony"; item: Testimony }
  | { kind: "interview"; item: Interview }
  | null;

type ShareableAdminItem = Extract<Exclude<PendingEdit, null>, { kind: "post" | "news" | "event" }>;

type ActiveView =
  | "dashboard"
  | "posts"
  | "news"
  | "events"
  | "pastEditions"
  | "testimonies"
  | "interviews"
  | "photoGallery"
  | "adminRequests"
  | "permissionRequests"
  | "users"
  | "activity"
  | "messages";

type RequestJsonOptions = {
  retryDatabaseReady?: boolean;
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
  { id: "posts", label: "Blog", icon: <LibraryBooks fontSize="small" /> },
  { id: "news", label: "News", icon: <Article fontSize="small" /> },
  { id: "events", label: "Events", icon: <EventAvailable fontSize="small" /> },
  { id: "pastEditions", label: "Past Editions", icon: <PhotoLibrary fontSize="small" /> },
  { id: "testimonies", label: "Testimonies", icon: <AutoStories fontSize="small" /> },
  { id: "interviews", label: "Interviews", icon: <Article fontSize="small" /> },
  { id: "photoGallery", label: "Photo Gallery", icon: <PhotoLibrary fontSize="small" /> },
  { id: "adminRequests", label: "Admin Requests", icon: <AdminPanelSettings fontSize="small" /> },
  { id: "permissionRequests", label: "Blogger Requests", icon: <AdminPanelSettings fontSize="small" /> },
  { id: "users", label: "Users", icon: <AdminPanelSettings fontSize="small" /> },
  { id: "activity", label: "Activity", icon: <Dashboard fontSize="small" /> },
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
  testimonies: {
    title: "Reader Testimonies",
    subtitle: "Add testimonies that appear in the homepage testimony section.",
  },
  interviews: {
    title: "Interview Section",
    subtitle: "Add interview cards with image, role, and Q&A content.",
  },
  photoGallery: {
    title: "Photo Gallery",
    subtitle: "Upload images that appear in the homepage photo gallery carousel.",
  },
  adminRequests: {
    title: "Admin Requests",
    subtitle: "Approve users who requested access to the admin dashboard.",
  },
  permissionRequests: {
    title: "Blogger Requests",
    subtitle: "Approve users who requested full blogger access.",
  },
  users: {
    title: "Users",
    subtitle: "Admins can monitor accounts and delete users when needed.",
  },
  activity: {
    title: "Activity",
    subtitle: "Monitor important actions happening inside the app.",
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
        const headers = new Headers(init?.headers);
        Object.entries(getAuthHeaders()).forEach(([key, value]) => headers.set(key, value));
        const response = await fetch(endpoint, { ...init, headers });

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

const getDeleteItemLabel = (item: PendingDelete) => {
  if (!item) {
    return "this item";
  }

  if ("title" in item.item && item.item.title) {
    return item.item.title;
  }

  if ("name" in item.item && item.item.name) {
    return item.item.name;
  }

  return "this item";
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const postFormRef = useRef<HTMLFormElement>(null);
  const newsFormRef = useRef<HTMLFormElement>(null);
  const eventFormRef = useRef<HTMLFormElement>(null);
  const pastEditionFormRef = useRef<HTMLFormElement>(null);
  const testimonyFormRef = useRef<HTMLFormElement>(null);
  const interviewFormRef = useRef<HTMLFormElement>(null);
  const photoGalleryFormRef = useRef<HTMLFormElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [pastEditions, setPastEditions] = useState<PastEdition[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [adminRequests, setAdminRequests] = useState<AuthUser[]>([]);
  const [permissionRequests, setPermissionRequests] = useState<AuthUser[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [resolvingAdminRequestId, setResolvingAdminRequestId] = useState<string | null>(null);
  const [resolvingPermissionRequestId, setResolvingPermissionRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingPastEdition, setIsSavingPastEdition] = useState(false);
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);
  const [isSavingInterview, setIsSavingInterview] = useState(false);
  const [isSavingPhotoGallery, setIsSavingPhotoGallery] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedBlogImageNames, setSelectedBlogImageNames] = useState("");
  const [selectedPastEditionImageNames, setSelectedPastEditionImageNames] = useState("");
  const [selectedTestimonyImageNames, setSelectedTestimonyImageNames] = useState("");
  const [selectedInterviewImageNames, setSelectedInterviewImageNames] = useState("");
  const [selectedPhotoGalleryImageNames, setSelectedPhotoGalleryImageNames] = useState("");
  const [interviewQaCount, setInterviewQaCount] = useState(1);
  const [editInterviewQaCount, setEditInterviewQaCount] = useState(1);
  const [selectedNewsImageNames, setSelectedNewsImageNames] = useState("");
  const [selectedNewsImagePreviews, setSelectedNewsImagePreviews] = useState<string[]>([]);
  const [selectedEventImages, setSelectedEventImages] = useState<File[]>([]);
  const [selectedEventImageNames, setSelectedEventImageNames] = useState("");
  const [selectedEventImageCount, setSelectedEventImageCount] = useState(0);
  const [selectedEventImagePreviews, setSelectedEventImagePreviews] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedEditImageNames, setSelectedEditImageNames] = useState("");
  const [selectedEditImagePreviews, setSelectedEditImagePreviews] = useState<string[]>([]);
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
  const safePostPage = Math.min(postPage, postPageCount);
  const safeNewsPage = Math.min(newsPage, newsPageCount);
  const safeEventPage = Math.min(eventPage, eventPageCount);
  const visiblePosts = useMemo(() => paginateItems(filteredPosts, safePostPage), [filteredPosts, safePostPage]);
  const visibleNews = useMemo(() => paginateItems(filteredNews, safeNewsPage), [filteredNews, safeNewsPage]);
  const visibleEvents = useMemo(() => paginateItems(filteredEvents, safeEventPage), [safeEventPage, filteredEvents]);
  const currentView = viewCopy[activeView];
  const isOwnerAdmin = user?.role === "admin";
  const can = useCallback((permission: Permission) => hasPermission(user, permission), [user]);
  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (["adminRequests", "permissionRequests", "users", "activity", "messages"].includes(item.id)) {
          return isOwnerAdmin;
        }

        if (item.id === "posts") return can("posts:create") || can("posts:update") || can("posts:delete");
        if (item.id === "news") return can("news:create") || can("news:update") || can("news:delete");
        if (item.id === "events") return can("events:create") || can("events:update") || can("events:delete");
        if (item.id === "pastEditions") return can("pastEditions:create") || can("pastEditions:delete");
        if (item.id === "testimonies") return can("testimonies:create") || can("testimonies:update") || can("testimonies:delete");
        if (item.id === "interviews") return can("interviews:create") || can("interviews:update") || can("interviews:delete");
        if (item.id === "photoGallery") return can("photoGallery:create") || can("photoGallery:delete");

        return true;
      }),
    [can, isOwnerAdmin]
  );

  const handleShareAdminItem = async (item: ShareableAdminItem) => {
    const itemId = item.kind === "event" ? item.item._id || item.item.id : item.item._id;

    if (!itemId) {
      setFeedback({ severity: "error", message: "This item needs an id before it can be shared." });
      return;
    }

    const sharePath =
      item.kind === "event" ? `/events/${itemId}` : item.kind === "news" ? `/news/${itemId}` : `/blog/${itemId}`;
    const shareText =
      item.kind === "event"
        ? item.item.description
        : item.kind === "news"
        ? item.item.description
        : item.item.desc;

    try {
      const result = await shareContent({
        title: item.item.title,
        text: shareText,
        path: sharePath,
      });

      setFeedback({
        severity: "success",
        message: result === "copied" ? "Share link copied to clipboard." : "Share sheet opened.",
      });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      setFeedback({ severity: "error", message: "Unable to share this item." });
    }
  };

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    const [
      postResult,
      eventResult,
      messageResult,
      newsResult,
      pastEditionResult,
      testimonyResult,
      interviewResult,
      photoGalleryResult,
      deletedPostsResult,
      adminRequestResult,
      permissionRequestResult,
      userResult,
      auditLogResult,
    ] = await Promise.all([
      requestCollection<Post>([POST_ENDPOINT], "Unable to load blogs."),
      requestCollection<UpcomingEvent>(EVENT_ENDPOINTS, "Unable to load upcoming events."),
      isOwnerAdmin
        ? requestCollection<ContactMessage>(CONTACT_ENDPOINTS, "Unable to load contact messages.")
        : Promise.resolve({ items: [] as ContactMessage[], error: "" }),
      requestCollection<NewsItem>([NEWS_ENDPOINT], "Unable to load news."),
      requestCollection<PastEdition>([PAST_EDITIONS_ENDPOINT], "Unable to load past editions."),
      requestCollection<Testimony>([TESTIMONIES_ENDPOINT], "Unable to load testimonies."),
      requestCollection<Interview>([INTERVIEWS_ENDPOINT], "Unable to load interviews."),
      requestCollection<GalleryPhoto>([PHOTO_GALLERY_ENDPOINT], "Unable to load photo gallery."),
      isOwnerAdmin
        ? requestCollection<Post>([DELETED_POSTS_ENDPOINT], "Unable to load deleted blogs.")
        : Promise.resolve({ items: [] as Post[], error: "" }),
      isOwnerAdmin
        ? loadAdminRequests()
        .then((items) => ({ items, error: "" }))
        .catch((error) => ({
          items: [] as AuthUser[],
          error: error instanceof Error ? error.message : "Unable to load admin requests.",
        }))
        : Promise.resolve({ items: [] as AuthUser[], error: "" }),
      isOwnerAdmin
        ? loadPermissionRequests()
            .then((items) => ({ items, error: "" }))
            .catch((error) => ({
              items: [] as AuthUser[],
              error: error instanceof Error ? error.message : "Unable to load blogger requests.",
            }))
        : Promise.resolve({ items: [] as AuthUser[], error: "" }),
      isOwnerAdmin
        ? loadUsers()
            .then((items) => ({ items, error: "" }))
            .catch((error) => ({
              items: [] as AuthUser[],
              error: error instanceof Error ? error.message : "Unable to load users.",
            }))
        : Promise.resolve({ items: [] as AuthUser[], error: "" }),
      isOwnerAdmin
        ? loadAuditLogs()
            .then((items) => ({ items, error: "" }))
            .catch((error) => ({
              items: [] as AuditLog[],
              error: error instanceof Error ? error.message : "Unable to load activity.",
            }))
        : Promise.resolve({ items: [] as AuditLog[], error: "" }),
    ]);

    setPosts(postResult.items);
    setNews(newsResult.items);
    setEvents(eventResult.items);
    setMessages(messageResult.items);
    setPastEditions(pastEditionResult.items);
    setTestimonies(testimonyResult.items);
    setInterviews(interviewResult.items);
    setGalleryPhotos(photoGalleryResult.items);
    setDeletedPosts(deletedPostsResult.items);
    setAdminRequests(adminRequestResult.items);
    setPermissionRequests(permissionRequestResult.items);
    setUsers(userResult.items);
    setAuditLogs(auditLogResult.items);

    const failedSections = [
      postResult.error && "blogs",
      eventResult.error && "events",
      messageResult.error && "messages",
      newsResult.error && "news",
      pastEditionResult.error && "past editions",
      testimonyResult.error && "testimonies",
      interviewResult.error && "interviews",
      photoGalleryResult.error && "photo gallery",
      deletedPostsResult.error && "deleted blogs",
      adminRequestResult.error && "admin requests",
      permissionRequestResult.error && "blogger requests",
      userResult.error && "users",
      auditLogResult.error && "activity",
    ].filter(Boolean);

    if (failedSections.length > 0) {
      setFeedback({
        severity: "error",
        message: `Could not load ${failedSections.join(", ")}. Showing only data returned from the backend.`,
      });
    }

    setIsLoading(false);
  }, [isOwnerAdmin]);

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
      selectedNewsImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedNewsImagePreviews]);

  useEffect(() => {
    return () => {
      selectedEventImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedEventImagePreviews]);

  useEffect(() => {
    return () => {
      selectedEditImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedEditImagePreviews]);

  const handleNewsImageChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(changeEvent.target.files || []);

    selectedNewsImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));

    if (!files.length) {
      setSelectedNewsImageNames("");
      setSelectedNewsImagePreviews([]);
      return;
    }

    const allImageFiles = files.filter((file) => file.type.startsWith("image/"));
    const imageFiles = allImageFiles.slice(0, MAX_EVENT_IMAGES);

    if (allImageFiles.length !== files.length) {
      changeEvent.target.value = "";
      setSelectedNewsImageNames("");
      setSelectedNewsImagePreviews([]);
      setFeedback({ severity: "error", message: "Please choose image files only." });
      return;
    }

    const largeImageNames = getLargeImageNames(imageFiles);
    if (largeImageNames.length > 0) {
      changeEvent.target.value = "";
      setSelectedNewsImageNames("");
      setSelectedNewsImagePreviews([]);
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    if (getTotalFileSize(imageFiles) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      changeEvent.target.value = "";
      setSelectedNewsImageNames("");
      setSelectedNewsImagePreviews([]);
      setFeedback({ severity: "error", message: buildTotalUploadTooLargeMessage() });
      return;
    }

    if (allImageFiles.length > MAX_EVENT_IMAGES) {
      setFeedback({ severity: "error", message: `Only ${MAX_EVENT_IMAGES} news images can be uploaded.` });
    }

    setSelectedNewsImageNames(imageFiles.map((file) => file.name).join(", "));
    setSelectedNewsImagePreviews(imageFiles.map((file) => URL.createObjectURL(file)));
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

  const clearEditImageState = () => {
    selectedEditImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedEditImageNames("");
    setSelectedEditImagePreviews([]);
  };

  const handleOpenEdit = (editItem: Exclude<PendingEdit, null>) => {
    clearEditImageState();
    setEditInterviewQaCount(editItem.kind === "interview" ? Math.max(editItem.item.qa.length, 1) : 1);
    setPendingEdit(editItem);
  };

  const handleCloseEdit = () => {
    if (isUpdating) {
      return;
    }

    setPendingEdit(null);
    clearEditImageState();
  };

  const handleEditImagesChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(changeEvent.target.files || []);
    clearEditImageState();

    if (!files.length) {
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      changeEvent.target.value = "";
      setFeedback({ severity: "error", message: "Please choose image files only." });
      return;
    }

    const uploadableImages = imageFiles.slice(0, MAX_EVENT_IMAGES);
    const largeImageNames = getLargeImageNames(uploadableImages);

    if (largeImageNames.length > 0) {
      changeEvent.target.value = "";
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    if (getTotalFileSize(uploadableImages) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      changeEvent.target.value = "";
      setFeedback({ severity: "error", message: buildTotalUploadTooLargeMessage() });
      return;
    }

    if (imageFiles.length > MAX_EVENT_IMAGES) {
      setFeedback({ severity: "error", message: `Only ${MAX_EVENT_IMAGES} images can be uploaded.` });
    }

    setSelectedEditImageNames(uploadableImages.map((file) => file.name).join(", "));
    setSelectedEditImagePreviews(uploadableImages.map((file) => URL.createObjectURL(file)));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingEdit) {
      return;
    }

    const itemId = pendingEdit.kind === "event" ? pendingEdit.item._id || pendingEdit.item.id : pendingEdit.item._id;

    if (!itemId) {
      setFeedback({ severity: "error", message: "This item cannot be updated because it has no database id." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const updateFormData = new FormData();

    if (pendingEdit.kind === "post") {
      const title = String(formData.get("title") || "").trim();
      const description = String(formData.get("desc") || "").trim();
      const type = String(formData.get("type") || "Magazine") as PostType;
      const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, MAX_EVENT_IMAGES);

      if (!title || !description) {
        setFeedback({ severity: "error", message: "Title and description are required." });
        return;
      }

      updateFormData.set("title", title);
      updateFormData.set("desc", description);
      updateFormData.set("type", type);

      imageFiles.forEach((image) => updateFormData.append("images", image));

      setIsUpdating(true);
      try {
        const updatedPost = await requestJson<Post>(
          [`${POST_ENDPOINT}/${itemId}`],
          { method: "PUT", body: updateFormData },
          "Unable to update blog."
        );
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === itemId ? updatedPost : post)));
        setFeedback({ severity: "success", message: "Blog updated successfully." });
        setPendingEdit(null);
        clearEditImageState();
      } catch (error) {
        setFeedback({ severity: "error", message: error instanceof Error ? error.message : "Unable to update blog." });
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (pendingEdit.kind === "news") {
      const title = String(formData.get("title") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, MAX_EVENT_IMAGES);

      if (!title || !description) {
        setFeedback({ severity: "error", message: "Title and description are required." });
        return;
      }

      updateFormData.set("title", title);
      updateFormData.set("description", description);

      imageFiles.forEach((image) => updateFormData.append("images", image));

      setIsUpdating(true);
      try {
        const updatedNews = await requestJson<NewsItem>(
          [`${NEWS_ENDPOINT}/${itemId}`],
          { method: "PUT", body: updateFormData },
          "Unable to update news."
        );
        setNews((currentNews) => currentNews.map((newsItem) => (newsItem._id === itemId ? updatedNews : newsItem)));
        setFeedback({ severity: "success", message: "News updated successfully." });
        setPendingEdit(null);
        clearEditImageState();
      } catch (error) {
        setFeedback({ severity: "error", message: error instanceof Error ? error.message : "Unable to update news." });
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (pendingEdit.kind === "testimony") {
      const name = String(formData.get("name") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, 1);

      if (!name || !message) {
        setFeedback({ severity: "error", message: "Name and message are required." });
        return;
      }

      updateFormData.set("name", name);
      updateFormData.set("message", message);
      updateFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
      imageFiles.forEach((image) => updateFormData.append("images", image));

      setIsUpdating(true);
      try {
        const updatedTestimony = await requestJson<Testimony>(
          [`${TESTIMONIES_ENDPOINT}/${itemId}`],
          { method: "PUT", body: updateFormData },
          "Unable to update testimony."
        );
        setTestimonies((currentTestimonies) =>
          currentTestimonies.map((testimony) => (testimony._id === itemId ? updatedTestimony : testimony))
        );
        setFeedback({ severity: "success", message: "Testimony updated successfully." });
        setPendingEdit(null);
        clearEditImageState();
      } catch (error) {
        setFeedback({ severity: "error", message: error instanceof Error ? error.message : "Unable to update testimony." });
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (pendingEdit.kind === "interview") {
      const name = String(formData.get("name") || "").trim();
      const role = String(formData.get("role") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const questions = formData.getAll("question").map((value) => String(value || "").trim());
      const answers = formData.getAll("answer").map((value) => String(value || "").trim());
      const qa = questions
        .map((question, index) => ({ question, answer: answers[index] || "" }))
        .filter((item) => item.question && item.answer);
      const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, 1);

      if (!name || !role || qa.length === 0) {
        setFeedback({ severity: "error", message: "Name, role, and at least one complete question and answer are required." });
        return;
      }

      updateFormData.set("name", name);
      updateFormData.set("role", role);
      updateFormData.set("message", message);
      updateFormData.set("qa", JSON.stringify(qa));
      updateFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
      imageFiles.forEach((image) => updateFormData.append("images", image));

      setIsUpdating(true);
      try {
        const updatedInterview = await requestJson<Interview>(
          [`${INTERVIEWS_ENDPOINT}/${itemId}`],
          { method: "PUT", body: updateFormData },
          "Unable to update interview."
        );
        setInterviews((currentInterviews) =>
          currentInterviews.map((interview) => (interview._id === itemId ? updatedInterview : interview))
        );
        setFeedback({ severity: "success", message: "Interview updated successfully." });
        setPendingEdit(null);
        clearEditImageState();
      } catch (error) {
        setFeedback({ severity: "error", message: error instanceof Error ? error.message : "Unable to update interview." });
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, MAX_EVENT_IMAGES);
    if (!title || !description) {
      setFeedback({ severity: "error", message: "Title and description are required." });
      return;
    }

    updateFormData.set("title", title);
    updateFormData.set("description", description);
    updateFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
    imageFiles.forEach((image) => updateFormData.append("images", image));

    setIsUpdating(true);
    try {
      const updatedEvent = await requestJson<UpcomingEvent>(
        EVENT_ENDPOINTS.map((endpoint) => `${endpoint}/${itemId}`),
        { method: "PUT", body: updateFormData },
        "Unable to update upcoming event."
      );
      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) => ((currentEvent._id || currentEvent.id) === itemId ? updatedEvent : currentEvent))
      );
      setFeedback({ severity: "success", message: "Upcoming event updated successfully." });
      setPendingEdit(null);
      clearEditImageState();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to update upcoming event.",
      });
    } finally {
      setIsUpdating(false);
    }
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

    if (getTotalFileSize(imageFiles.slice(0, MAX_EVENT_IMAGES)) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      setFeedback({ severity: "error", message: buildTotalUploadTooLargeMessage() });
      return;
    }

    const buildBlogFormData = () => {
      const blogFormData = new FormData();
      blogFormData.set("title", title);
      blogFormData.set("desc", desc);
      blogFormData.set("type", type);
      imageFiles.slice(0, MAX_EVENT_IMAGES).forEach((image) => {
        blogFormData.append("images", image);
      });

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

    const imageFiles = formData.getAll("images").filter(isUsableImageFile);
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!title || !description || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "News title, description, and at least one image are required." });
      return;
    }

    const uploadableNewsImages = imageFiles.slice(0, MAX_EVENT_IMAGES);
    const largeImageNames = getLargeImageNames(uploadableNewsImages);
    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    if (getTotalFileSize(uploadableNewsImages) > MAX_EVENT_TOTAL_UPLOAD_BYTES) {
      setFeedback({ severity: "error", message: buildTotalUploadTooLargeMessage() });
      return;
    }

    const newsFormData = new FormData();
    newsFormData.set("title", title);
    newsFormData.set("description", description);
    uploadableNewsImages.forEach((image) => {
      newsFormData.append("images", image);
    });

    setIsSavingNews(true);
    try {
      const createdNews = await requestJson<NewsItem>(
        [NEWS_ENDPOINT],
        {
          method: "POST",
          body: newsFormData,
        },
        "Unable to publish news."
      );

      setNews((currentNews) => [createdNews, ...currentNews]);
      newsFormRef.current?.reset();
      selectedNewsImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setSelectedNewsImageNames("");
      setSelectedNewsImagePreviews([]);
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

  const handleTestimonySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, 1);

    if (!name || !message || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Name, message, and image are required." });
      return;
    }

    const largeImageNames = getLargeImageNames(imageFiles);
    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    const testimonyFormData = new FormData();
    testimonyFormData.set("name", name);
    testimonyFormData.set("message", message);
    testimonyFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
    imageFiles.forEach((image) => testimonyFormData.append("images", image));

    setIsSavingTestimony(true);
    try {
      const createdTestimony = await requestJson<Testimony>(
        [TESTIMONIES_ENDPOINT],
        { method: "POST", body: testimonyFormData },
        "Unable to create testimony."
      );

      setTestimonies((currentTestimonies) => [createdTestimony, ...currentTestimonies]);
      testimonyFormRef.current?.reset();
      setSelectedTestimonyImageNames("");
      setFeedback({ severity: "success", message: "Testimony created successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to create testimony.",
      });
    } finally {
      setIsSavingTestimony(false);
    }
  };

  const handleInterviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const role = String(formData.get("role") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const questions = formData.getAll("question").map((value) => String(value || "").trim());
    const answers = formData.getAll("answer").map((value) => String(value || "").trim());
    const qa = questions
      .map((question, index) => ({ question, answer: answers[index] || "" }))
      .filter((item) => item.question && item.answer);
    const imageFiles = formData.getAll("images").filter(isUsableImageFile).slice(0, 1);

    if (!name || !role || qa.length === 0 || imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Name, role, image, and at least one complete question and answer are required." });
      return;
    }

    const largeImageNames = getLargeImageNames(imageFiles);
    if (largeImageNames.length > 0) {
      setFeedback({ severity: "error", message: buildLargeImageMessage(largeImageNames) });
      return;
    }

    const interviewFormData = new FormData();
    interviewFormData.set("name", name);
    interviewFormData.set("role", role);
    interviewFormData.set("message", message);
    interviewFormData.set("qa", JSON.stringify(qa));
    interviewFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
    imageFiles.forEach((image) => interviewFormData.append("images", image));

    setIsSavingInterview(true);
    try {
      const createdInterview = await requestJson<Interview>(
        [INTERVIEWS_ENDPOINT],
        { method: "POST", body: interviewFormData },
        "Unable to create interview."
      );

      setInterviews((currentInterviews) => [createdInterview, ...currentInterviews]);
      interviewFormRef.current?.reset();
      setSelectedInterviewImageNames("");
      setInterviewQaCount(1);
      setFeedback({ severity: "success", message: "Interview created successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to create interview.",
      });
    } finally {
      setIsSavingInterview(false);
    }
  };

  const handlePhotoGallerySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const imageFiles = formData.getAll("images").filter(isUsableImageFile);

    if (imageFiles.length === 0) {
      setFeedback({ severity: "error", message: "Choose at least one gallery image." });
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

    const photoGalleryFormData = new FormData();
    photoGalleryFormData.set("title", title);
    photoGalleryFormData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");
    uploadableImages.forEach((image) => photoGalleryFormData.append("images", image));

    setIsSavingPhotoGallery(true);
    try {
      const createdPhotos = await requestJson<GalleryPhoto[]>(
        [PHOTO_GALLERY_ENDPOINT],
        { method: "POST", body: photoGalleryFormData },
        "Unable to upload gallery images."
      );

      setGalleryPhotos((currentPhotos) => [...createdPhotos, ...currentPhotos]);
      photoGalleryFormRef.current?.reset();
      setSelectedPhotoGalleryImageNames("");
      setFeedback({ severity: "success", message: "Gallery images uploaded successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to upload gallery images.",
      });
    } finally {
      setIsSavingPhotoGallery(false);
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
      if (isOwnerAdmin) {
        setDeletedPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost._id !== post._id));
        setFeedback({ severity: "success", message: "Blog deleted permanently." });
      } else {
        setFeedback({ severity: "success", message: "Blog removed from users and sent to admin review." });
      }
      if (isOwnerAdmin) {
        void loadAdminData();
      }
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete blog.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreDeletedPost = async (post: Post) => {
    if (!post._id) {
      setFeedback({ severity: "error", message: "This blog cannot be restored because it has no database id." });
      return;
    }

    setDeletingId(post._id);
    try {
      const response = await requestJson<{ message: string; post: Post }>(
        [`${POST_ENDPOINT}/${post._id}/restore`],
        { method: "PATCH" },
        "Unable to restore blog."
      );
      setDeletedPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost._id !== post._id));
      setPosts((currentPosts) => [response.post, ...currentPosts]);
      setFeedback({ severity: "success", message: "Blog restored for users." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to restore blog.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePermanentDeletePost = async (post: Post) => {
    if (!post._id) {
      setFeedback({ severity: "error", message: "This blog cannot be permanently deleted because it has no database id." });
      return;
    }

    setDeletingId(post._id);
    try {
      await requestJson<{ message: string }>(
        [`${POST_ENDPOINT}/${post._id}/permanent`],
        { method: "DELETE" },
        "Unable to permanently delete blog."
      );
      setDeletedPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost._id !== post._id));
      setFeedback({ severity: "success", message: "Blog permanently deleted." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to permanently delete blog.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoLastPostEdit = async (post: Post) => {
    if (!post._id) {
      setFeedback({ severity: "error", message: "This blog cannot be reverted because it has no database id." });
      return;
    }

    setDeletingId(post._id);
    try {
      const response = await requestJson<{ message: string; post: Post }>(
        [`${POST_ENDPOINT}/${post._id}/undo-edit`],
        { method: "PATCH" },
        "Unable to undo blog edit."
      );
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) => (currentPost._id === post._id ? response.post : currentPost))
      );
      setFeedback({ severity: "success", message: "Latest blog edit was reverted." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to undo blog edit.",
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

    if (itemToDelete.kind === "testimony") {
      await handleDeleteTestimony(itemToDelete.item);
      return;
    }

    if (itemToDelete.kind === "interview") {
      await handleDeleteInterview(itemToDelete.item);
      return;
    }

    if (itemToDelete.kind === "galleryPhoto") {
      await handleDeleteGalleryPhoto(itemToDelete.item);
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
    const eventId = eventItem._id || eventItem.id;

    if (!eventId) {
      setFeedback({ severity: "error", message: "This event cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(eventId);
    setFeedback({ severity: "success", message: `Deleting "${eventItem.title}"...` });
    try {
      await requestJson<{ message: string }>(
        EVENT_ENDPOINTS.map((endpoint) => `${endpoint}/${eventId}`),
        { method: "DELETE" },
        "Unable to delete upcoming event."
      );

      setEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => (currentEvent._id || currentEvent.id) !== eventId)
      );
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

  const handleDeleteTestimony = async (testimony: Testimony) => {
    if (!testimony._id) {
      setFeedback({ severity: "error", message: "This testimony cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(testimony._id);
    setFeedback({ severity: "success", message: `Deleting "${testimony.name}"...` });
    try {
      await requestJson<{ message: string }>(
        [`${TESTIMONIES_ENDPOINT}/${testimony._id}`],
        { method: "DELETE" },
        "Unable to delete testimony."
      );

      setTestimonies((currentTestimonies) =>
        currentTestimonies.filter((currentTestimony) => currentTestimony._id !== testimony._id)
      );
      setFeedback({ severity: "success", message: "Testimony deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete testimony.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteInterview = async (interview: Interview) => {
    if (!interview._id) {
      setFeedback({ severity: "error", message: "This interview cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(interview._id);
    setFeedback({ severity: "success", message: `Deleting "${interview.name}"...` });
    try {
      await requestJson<{ message: string }>(
        [`${INTERVIEWS_ENDPOINT}/${interview._id}`],
        { method: "DELETE" },
        "Unable to delete interview."
      );

      setInterviews((currentInterviews) =>
        currentInterviews.filter((currentInterview) => currentInterview._id !== interview._id)
      );
      setFeedback({ severity: "success", message: "Interview deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete interview.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteGalleryPhoto = async (photo: GalleryPhoto) => {
    if (!photo._id) {
      setFeedback({ severity: "error", message: "This gallery image cannot be deleted because it has no database id." });
      return;
    }

    setDeletingId(photo._id);
    setFeedback({ severity: "success", message: "Deleting gallery image..." });
    try {
      await requestJson<{ message: string }>(
        [`${PHOTO_GALLERY_ENDPOINT}/${photo._id}`],
        { method: "DELETE" },
        "Unable to delete gallery image."
      );

      setGalleryPhotos((currentPhotos) => currentPhotos.filter((currentPhoto) => currentPhoto._id !== photo._id));
      setFeedback({ severity: "success", message: "Gallery image deleted successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete gallery image.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleResolveAdminRequest = async (requestUser: AuthUser, status: "approved" | "rejected") => {
    setResolvingAdminRequestId(requestUser._id);
    try {
      await resolveAdminRequest(requestUser._id, status);
      setAdminRequests((currentRequests) => currentRequests.filter((currentUser) => currentUser._id !== requestUser._id));
      setFeedback({
        severity: "success",
        message: status === "approved" ? `${requestUser.name} is now an admin.` : `${requestUser.name}'s request was rejected.`,
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to update admin request.",
      });
    } finally {
      setResolvingAdminRequestId(null);
    }
  };

  const handleResolvePermissionRequest = async (requestUser: AuthUser, status: "approved" | "rejected") => {
    setResolvingPermissionRequestId(requestUser._id);
    try {
      await resolvePermissionRequest(requestUser._id, status);
      setPermissionRequests((currentRequests) => currentRequests.filter((currentUser) => currentUser._id !== requestUser._id));
      setFeedback({
        severity: "success",
        message: status === "approved" ? `${requestUser.name} is now a blogger.` : `${requestUser.name}'s blogger request was rejected.`,
      });
      void loadAdminData();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to update blogger request.",
      });
    } finally {
      setResolvingPermissionRequestId(null);
    }
  };

  const handleDeleteUser = async (targetUser: AuthUser) => {
    setDeletingId(targetUser._id);
    try {
      await deleteUser(targetUser._id);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser._id !== targetUser._id));
      setFeedback({ severity: "success", message: `${targetUser.name} was deleted.` });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to delete user.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateUserRole = async (targetUser: AuthUser, role: "user" | "blogger") => {
    setResolvingPermissionRequestId(targetUser._id);
    try {
      const result = await updateUserRole(targetUser._id, role);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) => (currentUser._id === targetUser._id ? result.user : currentUser))
      );
      setPermissionRequests((currentRequests) =>
        currentRequests.filter((currentUser) => currentUser._id !== targetUser._id)
      );
      setFeedback({
        severity: "success",
        message: role === "blogger" ? `${targetUser.name} is now a blogger.` : `${targetUser.name} is now a user.`,
      });
      void loadAdminData();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to update user role.",
      });
    } finally {
      setResolvingPermissionRequestId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
            {visibleNavItems.map((item) => {
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
              Signed in
            </Typography>
            <Typography sx={{ color: "#fff", fontSize: 13, wordBreak: "break-word", mb: 1.5 }}>
              {user?.name || "Admin"}
            </Typography>
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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
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
              <Button
                onClick={() => void handleLogout()}
                startIcon={<Logout />}
                sx={{
                  bgcolor: "#111318",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#2a2f38" },
                }}
              >
                Logout
              </Button>
            </Stack>
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
                { label: "Testimonies", value: testimonies.length, icon: <AutoStories /> },
                { label: "Interviews", value: interviews.length, icon: <Article /> },
                { label: "Gallery photos", value: galleryPhotos.length, icon: <PhotoLibrary /> },
                { label: "Admin requests", value: adminRequests.length, icon: <AdminPanelSettings /> },
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

          {(activeView === "posts" ||
            activeView === "news" ||
            activeView === "events" ||
            activeView === "pastEditions" ||
            activeView === "testimonies" ||
            activeView === "interviews" ||
            activeView === "photoGallery") && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 3,
              alignItems: "start",
            }}
          >
            {activeView === "posts" && can("posts:create") && (
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
                    Select blog images
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
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 0.5 }}>
                    Choose up to {MAX_EVENT_IMAGES} images. Each image must be {MAX_IMAGE_SIZE_LABEL} or smaller.
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
                  {isSavingPost ? "Publishing..." : "Publish blog"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "news" && can("news:create") && (
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
                    multiple
                    type="file"
                    name="images"
                    accept="image/*"
                    onChange={handleNewsImageChange}
                  />
                  {selectedNewsImagePreviews.length > 0 ? (
                    <>
                      <Box
                        sx={{
                          width: "100%",
                          minHeight: { xs: 220, sm: 260 },
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                          },
                          gap: 1,
                          p: 1,
                        }}
                      >
                        {selectedNewsImagePreviews.map((preview, index) => (
                          <Box
                            key={preview}
                            component="img"
                            src={preview}
                            alt={`Selected news ${index + 1}`}
                            sx={{
                              width: "100%",
                              aspectRatio: index === 0 ? { xs: "2 / 1", sm: "2 / 1" } : "1 / 1",
                              gridColumn: index === 0 ? { xs: "span 2", sm: "span 2" } : "span 1",
                              objectFit: "cover",
                              borderRadius: 1.5,
                            }}
                          />
                        ))}
                      </Box>
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
                          {selectedNewsImageNames}
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
                          Choose up to {MAX_EVENT_IMAGES} images. Each image must be {MAX_IMAGE_SIZE_LABEL} or smaller.
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

            {activeView === "events" && can("events:create") && (
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

            {activeView === "pastEditions" && can("pastEditions:create") && (
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

            {activeView === "testimonies" && can("testimonies:create") && (
            <Paper
              ref={testimonyFormRef}
              component="form"
              onSubmit={handleTestimonySubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <AutoStories sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Add Testimony
                    </Typography>
                  </Box>
                  <Chip size="small" label="Testimony API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="Reader name" name="name" fullWidth />
                <TextField required multiline minRows={4} label="Message" name="message" fullWidth />

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
                    Select testimony image
                    <input
                      hidden
                      required
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        const names = Array.from(changeEvent.target.files || []).map((file) => file.name).join(", ");
                        setSelectedTestimonyImageNames(names);
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedTestimonyImageNames || "No image selected"}
                  </Typography>
                </Box>

                <FormControlLabel
                  control={<Checkbox name="isActive" defaultChecked sx={{ color: "#caa64a", "&.Mui-checked": { color: "#caa64a" } }} />}
                  label="Show on homepage"
                />

                <Button
                  type="submit"
                  disabled={isSavingTestimony}
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
                  {isSavingTestimony ? "Saving..." : "Create testimony"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "interviews" && can("interviews:create") && (
            <Paper
              ref={interviewFormRef}
              component="form"
              onSubmit={handleInterviewSubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Article sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Add Interview
                    </Typography>
                  </Box>
                  <Chip size="small" label="Interview API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField required label="Interviewee name" name="name" fullWidth />
                <TextField required label="Role" name="role" fullWidth />
                <TextField label="Intro text" name="message" fullWidth />

                {Array.from({ length: interviewQaCount }).map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      p: 1.5,
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      bgcolor: "#fff",
                    }}
                  >
                    <Typography sx={{ color: "#667085", fontSize: 13, fontWeight: 900 }}>
                      Q&A {index + 1}
                    </Typography>
                    <TextField required={index === 0} multiline minRows={2} label="Question" name="question" fullWidth />
                    <TextField required={index === 0} multiline minRows={4} label="Answer" name="answer" fullWidth />
                  </Box>
                ))}

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Add />}
                    disabled={interviewQaCount >= MAX_INTERVIEW_QA}
                    onClick={() => setInterviewQaCount((count) => Math.min(count + 1, MAX_INTERVIEW_QA))}
                    sx={{
                      borderColor: "#caa64a",
                      color: "#6f5517",
                      textTransform: "none",
                      fontWeight: 900,
                      "&:hover": { borderColor: "#caa64a", bgcolor: "#f7edd0" },
                    }}
                  >
                    Add question
                  </Button>
                  {interviewQaCount > 1 && (
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={() => setInterviewQaCount((count) => Math.max(count - 1, 1))}
                      sx={{
                        borderColor: "#fda29b",
                        color: "#b42318",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { borderColor: "#f97066", bgcolor: "#fff1f3" },
                      }}
                    >
                      Remove last
                    </Button>
                  )}
                </Box>

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
                    Select interview image
                    <input
                      hidden
                      required
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        const names = Array.from(changeEvent.target.files || []).map((file) => file.name).join(", ");
                        setSelectedInterviewImageNames(names);
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedInterviewImageNames || "No image selected"}
                  </Typography>
                </Box>

                <FormControlLabel
                  control={<Checkbox name="isActive" defaultChecked sx={{ color: "#caa64a", "&.Mui-checked": { color: "#caa64a" } }} />}
                  label="Show on homepage"
                />

                <Button
                  type="submit"
                  disabled={isSavingInterview}
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
                  {isSavingInterview ? "Saving..." : "Create interview"}
                </Button>
              </Stack>
            </Paper>
            )}

            {activeView === "photoGallery" && can("photoGallery:create") && (
            <Paper
              ref={photoGalleryFormRef}
              component="form"
              onSubmit={handlePhotoGallerySubmit}
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}
            >
              <Stack spacing={2.2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <PhotoLibrary sx={{ color: "#caa64a" }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Add Photo Gallery Images
                    </Typography>
                  </Box>
                  <Chip size="small" label="Photo Gallery API" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 800 }} />
                </Box>

                <Divider />

                <TextField label="Image title" name="title" fullWidth />

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
                    Select gallery images
                    <input
                      hidden
                      required
                      multiple
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(changeEvent) => {
                        const files = Array.from(changeEvent.target.files || []);
                        setSelectedPhotoGalleryImageNames(files.slice(0, MAX_EVENT_IMAGES).map((file) => file.name).join(", "));
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                    {selectedPhotoGalleryImageNames || "No image selected"}
                  </Typography>
                </Box>

                <FormControlLabel
                  control={<Checkbox name="isActive" defaultChecked sx={{ color: "#caa64a", "&.Mui-checked": { color: "#caa64a" } }} />}
                  label="Show on homepage"
                />

                <Button
                  type="submit"
                  disabled={isSavingPhotoGallery}
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
                  {isSavingPhotoGallery ? "Uploading..." : "Upload gallery images"}
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
                  onChange={(event) => {
                    setPostSearch(event.target.value);
                    setPostPage(1);
                  }}
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
                      gridTemplateColumns: { xs: "56px 1fr", sm: "56px 1fr auto auto auto auto" },
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
                        <Box component="img" src={post.image || post.images?.[0]} alt="" loading="lazy" decoding="async" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                      onClick={() => void handleShareAdminItem({ kind: "post", item: post })}
                      startIcon={<Share />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#175cd3",
                        border: "1px solid #b2ccff",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                      }}
                    >
                      Share
                    </Button>
                    {can("posts:update") && <Button
                      onClick={() => handleOpenEdit({ kind: "post", item: post })}
                      startIcon={<Edit />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#175cd3",
                        border: "1px solid #b2ccff",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                      }}
                    >
                      Edit
                    </Button>}
                    {can("posts:delete") && <Button
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
                    </Button>}
                    {isOwnerAdmin && (
                      <Button
                        onClick={() => void handleUndoLastPostEdit(post)}
                        disabled={deletingId === post._id}
                        size="small"
                        sx={{
                          gridColumn: { xs: "1 / -1", sm: "auto" },
                          justifySelf: { xs: "stretch", sm: "end" },
                          color: "#175cd3",
                          border: "1px solid #b2ccff",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                        }}
                      >
                        Undo last edit
                      </Button>
                    )}
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
                    page={safePostPage}
                    onChange={(_, page) => setPostPage(page)}
                    sx={{ alignSelf: "center", pt: 1 }}
                  />
                )}
              </Stack>

              {isOwnerAdmin && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>
                    Deleted blogs by bloggers
                  </Typography>
                  <Stack spacing={1.5}>
                    {deletedPosts.map((post) => (
                      <Box
                        key={`deleted-${post._id || post.title}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto auto" },
                          gap: 1.25,
                          alignItems: "center",
                          border: "1px solid #f4d8d5",
                          borderRadius: 1.5,
                          p: 1.25,
                          bgcolor: "#fff7f6",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                            {post.title}
                          </Typography>
                          <Typography sx={{ color: "#8a4b44", fontSize: 13 }} noWrap>
                            Deleted by {post.deletedBy?.name || "blogger"} {post.deletedAt ? `- ${formatDate(post.deletedAt)}` : ""}
                          </Typography>
                        </Box>
                        <Button
                          onClick={() => void handleRestoreDeletedPost(post)}
                          disabled={deletingId === post._id}
                          size="small"
                          sx={{
                            color: "#175cd3",
                            border: "1px solid #b2ccff",
                            bgcolor: "#fff",
                            textTransform: "none",
                            fontWeight: 900,
                            "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                          }}
                        >
                          Restore
                        </Button>
                        <Button
                          onClick={() => void handlePermanentDeletePost(post)}
                          disabled={deletingId === post._id}
                          size="small"
                          sx={{
                            color: "#b42318",
                            border: "1px solid #fda29b",
                            bgcolor: "#fff",
                            textTransform: "none",
                            fontWeight: 900,
                            "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                          }}
                        >
                          Delete permanently
                        </Button>
                      </Box>
                    ))}
                    {!deletedPosts.length && (
                      <Typography sx={{ color: "#667085" }}>No deleted blogs pending review.</Typography>
                    )}
                  </Stack>
                </Box>
              )}
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
                  onChange={(event) => {
                    setNewsSearch(event.target.value);
                    setNewsPage(1);
                  }}
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
                      gridTemplateColumns: { xs: "64px 1fr", sm: "64px 1fr auto auto auto" },
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
                        <Box component="img" src={newsItem.image} alt="" loading="lazy" decoding="async" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                      onClick={() => void handleShareAdminItem({ kind: "news", item: newsItem })}
                      startIcon={<Share />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#175cd3",
                        border: "1px solid #b2ccff",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                      }}
                    >
                      Share
                    </Button>
                    {can("news:update") && <Button
                      onClick={() => handleOpenEdit({ kind: "news", item: newsItem })}
                      startIcon={<Edit />}
                      size="small"
                      sx={{
                        gridColumn: { xs: "1 / -1", sm: "auto" },
                        justifySelf: { xs: "stretch", sm: "end" },
                        color: "#175cd3",
                        border: "1px solid #b2ccff",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                      }}
                    >
                      Edit
                    </Button>}
                    {can("news:delete") && <Button
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
                    </Button>}
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
                    page={safeNewsPage}
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
                  onChange={(changeEvent) => {
                    setEventSearch(changeEvent.target.value);
                    setEventPage(1);
                  }}
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
                {visibleEvents.map((event) => {
                  const eventId = event._id || event.id;
                  const eventImage = event.images?.[0] || "";

                  return (
                    <Box
                      key={eventId || `${event.title}-${event.createdAt}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "88px minmax(0, 1fr) 44px 44px 44px", md: "112px minmax(0, 1fr) auto auto 44px 44px 44px" },
                        alignItems: "center",
                        gap: { xs: 1.25, md: 2 },
                        border: "1px solid #edf0f2",
                        borderRadius: 1.5,
                        p: 1.25,
                        bgcolor: "#fff",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          aspectRatio: "4 / 3",
                          borderRadius: 1.25,
                          overflow: "hidden",
                          bgcolor: "#111318",
                          border: "1px solid #edf0f2",
                        }}
                      >
                        {eventImage ? (
                          <Box
                            component="img"
                            src={eventImage}
                            alt={event.title}
                            loading="lazy"
                            decoding="async"
                            sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              color: "#98a2b3",
                              bgcolor: "#f2f4f7",
                            }}
                          >
                            <Image fontSize="small" />
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                          {event.title}
                        </Typography>
                        <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                          {event.description || formatDate(event.createdAt)}
                        </Typography>
                        <Box sx={{ display: { xs: "flex", md: "none" }, gap: 0.75, flexWrap: "wrap", mt: 1 }}>
                          <Chip size="small" label={`${event.images?.length || 0} images`} sx={{ fontWeight: 900 }} />
                          <Chip
                            size="small"
                            label={event.isActive ? "Active" : "Hidden"}
                            sx={{
                              fontWeight: 900,
                              bgcolor: event.isActive ? "#ecfdf3" : "#f2f4f7",
                              color: event.isActive ? "#027a48" : "#667085",
                            }}
                          />
                        </Box>
                      </Box>

                      <Chip
                        size="small"
                        label={`${event.images?.length || 0} images`}
                        sx={{ display: { xs: "none", md: "inline-flex" }, fontWeight: 900 }}
                      />
                      <Chip
                        size="small"
                        label={event.isActive ? "Active" : "Hidden"}
                        sx={{
                          display: { xs: "none", md: "inline-flex" },
                          fontWeight: 900,
                          bgcolor: event.isActive ? "#ecfdf3" : "#f2f4f7",
                          color: event.isActive ? "#027a48" : "#667085",
                        }}
                      />
                      <IconButton
                        aria-label={`Share ${event.title}`}
                        onClick={() => void handleShareAdminItem({ kind: "event", item: event })}
                        sx={{
                          color: "#175cd3",
                          border: "1px solid #b2ccff",
                          borderRadius: 1.25,
                          bgcolor: "#fff",
                          "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                        }}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                      {can("events:update") && <IconButton
                        aria-label={`Edit ${event.title}`}
                        onClick={() => handleOpenEdit({ kind: "event", item: event })}
                        sx={{
                          color: "#175cd3",
                          border: "1px solid #b2ccff",
                          borderRadius: 1.25,
                          bgcolor: "#fff",
                          "&:hover": { bgcolor: "#eff8ff", borderColor: "#84adff" },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>}
                      {can("events:delete") && <IconButton
                        aria-label={`Delete ${event.title}`}
                        onClick={() => setPendingDelete({ kind: "event", item: event })}
                        disabled={deletingId === eventId}
                        sx={{
                          color: "#b42318",
                          border: "1px solid #fda29b",
                          borderRadius: 1.25,
                          bgcolor: "#fff",
                          "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>}
                    </Box>
                  );
                })}

                {!filteredEvents.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>
                    {events.length ? "No events match your search." : "No upcoming events returned from the API yet."}
                  </Typography>
                )}

                {filteredEvents.length > ADMIN_PAGE_SIZE && (
                  <Pagination
                    count={eventPageCount}
                    page={safeEventPage}
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
                      loading="lazy"
                      decoding="async"
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {can("pastEditions:delete") && <IconButton
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
                    </IconButton>}
                  </Box>
                ))}
              </Box>

              {!pastEditions.length && !isLoading && (
                <Typography sx={{ color: "#667085" }}>No past edition images returned from the API yet.</Typography>
              )}
            </Paper>
            )}

            {activeView === "testimonies" && (
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
                  Homepage Testimonies
                </Typography>
                <Chip size="small" label={`${testimonies.length} total`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>

              <Stack spacing={1.5}>
                {testimonies.map((testimony) => (
                  <Box
                    key={testimony._id || `${testimony.name}-${testimony.createdAt}`}
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
                    <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#f2f4f7", overflow: "hidden" }}>
                      <Box component="img" src={testimony.image} alt={testimony.name} loading="lazy" decoding="async" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                        {testimony.name}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                        {testimony.message}
                      </Typography>
                    </Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, justifySelf: { xs: "stretch", sm: "end" } }}
                    >
                      {can("testimonies:update") && <Button
                        onClick={() => handleOpenEdit({ kind: "testimony", item: testimony })}
                        startIcon={<Edit />}
                        size="small"
                        sx={{
                          color: "#6f5517",
                          border: "1px solid #caa64a",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#f7edd0", borderColor: "#caa64a" },
                        }}
                      >
                        Edit
                      </Button>}
                      {can("testimonies:delete") && <Button
                        onClick={() => setPendingDelete({ kind: "testimony", item: testimony })}
                        disabled={deletingId === testimony._id}
                        startIcon={<Delete />}
                        size="small"
                        sx={{
                          color: "#b42318",
                          border: "1px solid #fda29b",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                        }}
                      >
                        Delete
                      </Button>}
                    </Stack>
                  </Box>
                ))}

                {!testimonies.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No testimonies returned from the API yet.</Typography>
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "interviews" && (
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
                  Homepage Interviews
                </Typography>
                <Chip size="small" label={`${interviews.length} total`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>

              <Stack spacing={1.5}>
                {interviews.map((interview) => (
                  <Box
                    key={interview._id || `${interview.name}-${interview.createdAt}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "72px 1fr", sm: "72px 1fr auto" },
                      gap: 1.5,
                      alignItems: "center",
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: 1.25,
                    }}
                  >
                    <Box sx={{ width: 72, height: 72, borderRadius: 1, bgcolor: "#111318", overflow: "hidden" }}>
                      <Box component="img" src={interview.image} alt={interview.name} loading="lazy" decoding="async" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20" }} noWrap>
                        {interview.name}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }} noWrap>
                        {interview.role}
                      </Typography>
                    </Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, justifySelf: { xs: "stretch", sm: "end" } }}
                    >
                      {can("interviews:update") && <Button
                        onClick={() => handleOpenEdit({ kind: "interview", item: interview })}
                        startIcon={<Edit />}
                        size="small"
                        sx={{
                          color: "#6f5517",
                          border: "1px solid #caa64a",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#f7edd0", borderColor: "#caa64a" },
                        }}
                      >
                        Edit
                      </Button>}
                      {can("interviews:delete") && <Button
                        onClick={() => setPendingDelete({ kind: "interview", item: interview })}
                        disabled={deletingId === interview._id}
                        startIcon={<Delete />}
                        size="small"
                        sx={{
                          color: "#b42318",
                          border: "1px solid #fda29b",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                        }}
                      >
                        Delete
                      </Button>}
                    </Stack>
                  </Box>
                ))}

                {!interviews.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No interviews returned from the API yet.</Typography>
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "photoGallery" && (
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
                  Homepage Photo Gallery
                </Typography>
                <Chip size="small" label={`${galleryPhotos.length} total`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.5,
                }}
              >
                {galleryPhotos.map((photo, index) => (
                  <Box
                    key={photo._id || `${photo.image}-${index}`}
                    sx={{
                      position: "relative",
                      aspectRatio: "4 / 3",
                      overflow: "hidden",
                      borderRadius: 1.5,
                      bgcolor: "#111318",
                    }}
                  >
                    <Box
                      component="img"
                      src={photo.image}
                      alt={photo.title || `Gallery image ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {can("photoGallery:delete") && <IconButton
                      aria-label="Delete gallery image"
                      onClick={() => setPendingDelete({ kind: "galleryPhoto", item: photo })}
                      disabled={deletingId === photo._id}
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
                    </IconButton>}
                  </Box>
                ))}
              </Box>

              {!galleryPhotos.length && !isLoading && (
                <Typography sx={{ color: "#667085" }}>No gallery images returned from the API yet.</Typography>
              )}
            </Paper>
            )}

            {activeView === "adminRequests" && (
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
                  Pending Admin Requests
                </Typography>
                <Chip
                  size="small"
                  label={`${adminRequests.length} pending`}
                  sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }}
                />
              </Box>

              <Stack spacing={1.5}>
                {adminRequests.map((requestUser) => (
                  <Box
                    key={requestUser._id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
                      gap: 1.5,
                      alignItems: "center",
                      border: "1px solid #edf0f2",
                      borderRadius: 1.5,
                      p: { xs: 1.5, md: 2 },
                      bgcolor: "#fff",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, color: "#171a20", overflowWrap: "anywhere" }}>
                        {requestUser.name}
                      </Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13, overflowWrap: "anywhere" }}>
                        {requestUser.email} - {requestUser.phonenumber}
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        onClick={() => void handleResolveAdminRequest(requestUser, "approved")}
                        disabled={resolvingAdminRequestId === requestUser._id}
                        sx={{
                          bgcolor: "#12372A",
                          color: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#0b241b" },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => void handleResolveAdminRequest(requestUser, "rejected")}
                        disabled={resolvingAdminRequestId === requestUser._id}
                        sx={{
                          color: "#b42318",
                          border: "1px solid #fda29b",
                          bgcolor: "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: "#fff1f3", borderColor: "#f97066" },
                        }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </Box>
                ))}

                {!adminRequests.length && !isLoading && (
                  <Typography sx={{ color: "#667085" }}>No pending admin requests.</Typography>
                )}
              </Stack>
            </Paper>
            )}

            {activeView === "permissionRequests" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Pending Blogger Requests</Typography>
                <Chip size="small" label={`${permissionRequests.length} pending`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>
              <Stack spacing={1.5}>
                {permissionRequests.map((requestUser) => (
                  <Box key={requestUser._id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" }, gap: 1.5, p: 2, border: "1px solid #edf0f2", borderRadius: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{requestUser.name}</Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }}>{requestUser.email}</Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13, mt: 0.75 }}>
                        Requesting full blogger access for all content sections.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button onClick={() => void handleResolvePermissionRequest(requestUser, "approved")} disabled={resolvingPermissionRequestId === requestUser._id} sx={{ bgcolor: "#12372A", color: "#fff", textTransform: "none", fontWeight: 900 }}>Approve</Button>
                      <Button onClick={() => void handleResolvePermissionRequest(requestUser, "rejected")} disabled={resolvingPermissionRequestId === requestUser._id} sx={{ color: "#b42318", border: "1px solid #fda29b", textTransform: "none", fontWeight: 900 }}>Reject</Button>
                    </Stack>
                  </Box>
                ))}
                {!permissionRequests.length && !isLoading && <Typography sx={{ color: "#667085" }}>No pending blogger requests.</Typography>}
              </Stack>
            </Paper>
            )}

            {activeView === "users" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Users</Typography>
                <Chip size="small" label={`${users.length} total`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>
              <Stack spacing={1.5}>
                {users.map((account) => (
                  <Box key={account._id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" }, gap: 1.5, p: 2, border: "1px solid #edf0f2", borderRadius: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{account.name}</Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }}>{account.email} - {account.phonenumber}</Typography>
                      <Typography sx={{ color: "#667085", fontSize: 13 }}>Role: {account.role}</Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      {account.role === "user" && (
                        <Button
                          onClick={() => void handleUpdateUserRole(account, "blogger")}
                          disabled={resolvingPermissionRequestId === account._id}
                          sx={{ bgcolor: "#12372A", color: "#fff", textTransform: "none", fontWeight: 900 }}
                        >
                          Upgrade to blogger
                        </Button>
                      )}
                      {account.role === "blogger" && (
                        <Button
                          onClick={() => void handleUpdateUserRole(account, "user")}
                          disabled={resolvingPermissionRequestId === account._id}
                          sx={{ color: "#6f5517", border: "1px solid #caa64a", textTransform: "none", fontWeight: 900 }}
                        >
                          Downgrade to user
                        </Button>
                      )}
                      <Button onClick={() => void handleDeleteUser(account)} disabled={account._id === user?._id || deletingId === account._id} startIcon={<Delete />} sx={{ color: "#b42318", border: "1px solid #fda29b", textTransform: "none", fontWeight: 900 }}>Delete user</Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
            )}

            {activeView === "activity" && (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Activity Log</Typography>
                <Chip size="small" label={`${auditLogs.length} events`} sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900 }} />
              </Box>
              <Stack spacing={1.25}>
                {auditLogs.map((log) => (
                  <Box key={log._id} sx={{ p: 1.5, border: "1px solid #edf0f2", borderRadius: 1.5 }}>
                    <Typography sx={{ fontWeight: 900 }}>{log.action} / {log.resource}</Typography>
                    <Typography sx={{ color: "#667085", fontSize: 13 }}>{log.actorName || "System"} - {log.actorEmail || "no email"} - {formatDate(log.createdAt)}</Typography>
                    <Typography sx={{ color: "#98a2b3", fontSize: 12 }}>{log.method} {log.path}</Typography>
                  </Box>
                ))}
                {!auditLogs.length && !isLoading && <Typography sx={{ color: "#667085" }}>No activity recorded yet.</Typography>}
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
      <Dialog open={Boolean(pendingEdit)} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <Box
          component="form"
          key={pendingEdit ? `${pendingEdit.kind}-${pendingEdit.kind === "event" ? pendingEdit.item._id || pendingEdit.item.id : pendingEdit.item._id}` : "edit"}
          onSubmit={handleEditSubmit}
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            Edit{" "}
            {pendingEdit?.kind === "post"
              ? "blog"
              : pendingEdit?.kind === "news"
                ? "news"
                : pendingEdit?.kind === "event"
                  ? "upcoming event"
                  : pendingEdit?.kind === "testimony"
                    ? "testimony"
                    : "interview"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.2} sx={{ pt: 1 }}>
              {(pendingEdit?.kind === "post" || pendingEdit?.kind === "news" || pendingEdit?.kind === "event") && (
                <TextField required label="Title" name="title" fullWidth defaultValue={pendingEdit.item.title || ""} />
              )}

              {pendingEdit?.kind === "post" && (
                <TextField select required label="Type" name="type" defaultValue={pendingEdit.item.type || "Magazine"} fullWidth>
                  <MenuItem value="Magazine">Magazine</MenuItem>
                  <MenuItem value="Book">Book</MenuItem>
                </TextField>
              )}

              {(pendingEdit?.kind === "post" || pendingEdit?.kind === "news" || pendingEdit?.kind === "event") && (
                <TextField
                  required
                  multiline
                  minRows={4}
                  label="Description"
                  name={pendingEdit.kind === "post" ? "desc" : "description"}
                  fullWidth
                  defaultValue={
                    pendingEdit.kind === "post"
                      ? pendingEdit.item.desc
                      : pendingEdit.kind === "news"
                        ? pendingEdit.item.description
                        : pendingEdit.item.description || ""
                  }
                />
              )}

              {pendingEdit?.kind === "testimony" && (
                <>
                  <TextField required label="Reader name" name="name" fullWidth defaultValue={pendingEdit.item.name} />
                  <TextField
                    required
                    multiline
                    minRows={4}
                    label="Message"
                    name="message"
                    fullWidth
                    defaultValue={pendingEdit.item.message}
                  />
                </>
              )}

              {pendingEdit?.kind === "interview" && (
                <>
                  <TextField required label="Interviewee name" name="name" fullWidth defaultValue={pendingEdit.item.name} />
                  <TextField required label="Role" name="role" fullWidth defaultValue={pendingEdit.item.role} />
                  <TextField label="Intro text" name="message" fullWidth defaultValue={pendingEdit.item.message || ""} />
                  {Array.from({ length: editInterviewQaCount }).map((_, index) => {
                    const qaItem = pendingEdit.item.qa[index] || { question: "", answer: "" };
                    return (
                    <Box
                      key={index}
                      sx={{
                        display: "grid",
                        gap: 1.5,
                        p: 1.5,
                        border: "1px solid #edf0f2",
                        borderRadius: 1.5,
                        bgcolor: "#fff",
                      }}
                    >
                      <Typography sx={{ color: "#667085", fontSize: 13, fontWeight: 900 }}>
                        Q&A {index + 1}
                      </Typography>
                      <TextField
                        required={index === 0}
                        multiline
                        minRows={2}
                        label="Question"
                        name="question"
                        fullWidth
                        defaultValue={qaItem.question}
                      />
                      <TextField
                        required={index === 0}
                        multiline
                        minRows={4}
                        label="Answer"
                        name="answer"
                        fullWidth
                        defaultValue={qaItem.answer}
                      />
                    </Box>
                    );
                  })}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<Add />}
                      disabled={editInterviewQaCount >= MAX_INTERVIEW_QA}
                      onClick={() => setEditInterviewQaCount((count) => Math.min(count + 1, MAX_INTERVIEW_QA))}
                      sx={{
                        borderColor: "#caa64a",
                        color: "#6f5517",
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { borderColor: "#caa64a", bgcolor: "#f7edd0" },
                      }}
                    >
                      Add question
                    </Button>
                    {editInterviewQaCount > 1 && (
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<Delete />}
                        onClick={() => setEditInterviewQaCount((count) => Math.max(count - 1, 1))}
                        sx={{
                          borderColor: "#fda29b",
                          color: "#b42318",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { borderColor: "#f97066", bgcolor: "#fff1f3" },
                        }}
                      >
                        Remove last
                      </Button>
                    )}
                  </Box>
                </>
              )}

              {(pendingEdit?.kind === "event" || pendingEdit?.kind === "testimony" || pendingEdit?.kind === "interview") && (
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isActive"
                      defaultChecked={pendingEdit.item.isActive}
                      sx={{ color: "#caa64a", "&.Mui-checked": { color: "#caa64a" } }}
                    />
                  }
                  label={
                    pendingEdit?.kind === "event"
                      ? "Show this event as active"
                      : pendingEdit?.kind === "testimony"
                        ? "Show on homepage"
                        : "Show on homepage"
                  }
                />
              )}

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
                  {pendingEdit?.kind === "event" ? "Replace event images" : "Replace image"}
                  <input
                    hidden
                    multiple={pendingEdit?.kind !== "testimony" && pendingEdit?.kind !== "interview"}
                    type="file"
                    name="images"
                    accept="image/*"
                    onChange={handleEditImagesChange}
                  />
                </Button>
                <Typography sx={{ color: "#667085", fontSize: 13, mt: 1 }}>
                  {selectedEditImageNames || "Leave empty to keep current images."}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                {(selectedEditImagePreviews.length
                  ? selectedEditImagePreviews
                  : pendingEdit?.kind === "event"
                    ? pendingEdit.item.images || []
                    : pendingEdit?.kind === "post"
                      ? pendingEdit.item.images || (pendingEdit.item.image ? [pendingEdit.item.image] : [])
                      : pendingEdit?.kind === "news"
                        ? pendingEdit.item.images || (pendingEdit.item.image ? [pendingEdit.item.image] : [])
                        : pendingEdit?.kind === "testimony" || pendingEdit?.kind === "interview"
                          ? pendingEdit.item.image
                            ? [pendingEdit.item.image]
                            : []
                        : []
                ).map((image, index) => (
                  <Box
                    key={`${image}-${index}`}
                    component="img"
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      borderRadius: 1.25,
                      border: "1px solid #edf0f2",
                      bgcolor: "#f2f4f7",
                    }}
                  />
                ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleCloseEdit}
              disabled={isUpdating}
              sx={{ color: "#475467", textTransform: "none", fontWeight: 800 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              startIcon={<Save />}
              sx={{
                bgcolor: "#111318",
                color: "#fff",
                textTransform: "none",
                fontWeight: 900,
                "&:hover": { bgcolor: "#2a2f38" },
              }}
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete item?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#475467" }}>
            Do you want to delete "{getDeleteItemLabel(pendingDelete)}"? This action cannot be undone.
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
