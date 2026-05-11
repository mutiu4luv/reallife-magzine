import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import PersonIcon from "@mui/icons-material/Person";
import TerrainIcon from "@mui/icons-material/Terrain";
import Footer from "../components/Footer";
import ContentLoader from "../components/ContentLoader";
import {
  loadNews,
  loadNewsById,
  loadPosts,
  loadPostById,
  loadUpcomingEvents,
  loadUpcomingEventById,
  requestJson,
  type EventItem,
  type NewsItem,
  type PostItem,
  UPCOMING_EVENTS_ENDPOINTS,
} from "../services/contentApi";

const gold = "#A67C1B";
const deepGreen = "#12372A";
const pageBg = "#080806";
const ivory = "#fffaf0";

type DetailKind = "post" | "news" | "event";

type DetailItem = {
  id?: string;
  title: string;
  body: string;
  image: string;
  images?: string[];
  label: string;
  createdAt?: string;
};

type ContentBlock =
  | {
      type: "paragraph";
      value: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
    };

type ContentDetailScreenProps = {
  kind: DetailKind;
};

type RelatedItem = {
  id?: string;
  title: string;
  excerpt: string;
  image: string;
  label: string;
  createdAt?: string;
  path: string;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Published";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const stripHtml = (value: string) => {
  if (!value) {
    return "";
  }

  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const element = window.document.createElement("div");
  element.innerHTML = value;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
};

const getReadingTime = (value: string) => {
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
};

const uniqueImages = (images: string[]) => Array.from(new Set(images.filter(Boolean)));

const getItemId = (item: { _id?: string; id?: string }) => item._id || item.id;

const parseBodyBlocks = (body: string): ContentBlock[] => {
  if (!body.trim()) {
    return [];
  }

  if (!/<[a-z][\s\S]*>/i.test(body)) {
    return body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({ type: "paragraph", value: paragraph }));
  }

  if (typeof window === "undefined") {
    return [{ type: "paragraph", value: stripHtml(body) }];
  }

  const doc = new DOMParser().parseFromString(body, "text/html");
  const blocks: ContentBlock[] = [];

  Array.from(doc.body.children).forEach((node) => {
    node.querySelectorAll("img").forEach((image) => {
      const src = image.getAttribute("src");
      if (src) {
        blocks.push({ type: "image", src, alt: image.getAttribute("alt") || "" });
      }
    });

    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("img").forEach((image) => image.remove());
    const text = (clone.textContent || "").replace(/\s+/g, " ").trim();

    if (text) {
      blocks.push({ type: "paragraph", value: text });
    }
  });

  return blocks.length ? blocks : [{ type: "paragraph", value: stripHtml(body) }];
};

const toDetailItem = (kind: DetailKind, item: PostItem | NewsItem | EventItem): DetailItem => {
  if (kind === "event") {
    const event = item as EventItem;
    return {
      id: getItemId(event),
      title: event.title,
      body: event.description || event.desc || "",
      image: event.images[0] || "",
      images: event.images,
      label: "Event",
      createdAt: event.createdAt,
    };
  }

  if (kind === "news") {
    const news = item as NewsItem;
    return {
      id: getItemId(news),
      title: news.title,
      body: news.description || news.desc || "",
      image: news.image,
      label: "News",
      createdAt: news.createdAt,
    };
  }

  const post = item as PostItem;
  return {
    id: getItemId(post),
    title: post.title,
    body: post.desc || post.description || "",
    image: post.image || post.images?.[0] || "",
    images: post.images || (post.image ? [post.image] : []),
    label: post.type || "Article",
    createdAt: post.createdAt,
  };
};

const getRelatedPath = (kind: DetailKind, id?: string) => {
  if (!id) {
    return backPathByKind(kind);
  }

  if (kind === "event") {
    return `/events/${id}`;
  }

  return kind === "news" ? `/news/${id}` : `/blog/${id}`;
};

const backPathByKind = (kind: DetailKind) => {
  if (kind === "event") {
    return "/events";
  }

  return kind === "news" ? "/news" : "/blog";
};

const toRelatedItem = (kind: DetailKind, item: PostItem | NewsItem | EventItem): RelatedItem => {
  if (kind === "event") {
    const event = item as EventItem;
    const itemId = getItemId(event);

    return {
      id: itemId,
      title: event.title,
      excerpt: stripHtml(event.description || event.desc || ""),
      image: event.images[0] || "",
      label: "Event",
      createdAt: event.createdAt,
      path: getRelatedPath(kind, itemId),
    };
  }

  if (kind === "news") {
    const news = item as NewsItem;
    const itemId = getItemId(news);

    return {
      id: itemId,
      title: news.title,
      excerpt: stripHtml(news.description || news.desc || ""),
      image: news.image,
      label: "News",
      createdAt: news.createdAt,
      path: getRelatedPath(kind, itemId),
    };
  }

  const post = item as PostItem;
  const itemId = getItemId(post);

  return {
    id: itemId,
    title: post.title,
    excerpt: stripHtml(post.desc || post.description || ""),
    image: post.image || post.images?.[0] || "",
    label: post.type || "Article",
    createdAt: post.createdAt,
    path: getRelatedPath(kind, itemId),
  };
};

const sortNewestFirst = <T extends { createdAt?: string }>(items: T[]) =>
  [...items].sort((first, second) => {
    const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return secondTime - firstTime;
  });

const ContentDetailScreen: React.FC<ContentDetailScreenProps> = ({ kind }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const backPath = useMemo(() => backPathByKind(kind), [kind]);

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      if (!id) {
        setError("Missing content id.");
        setLoading(false);
        return;
      }

      try {
        const payload =
          kind === "event"
            ? await loadUpcomingEventById(id)
            : kind === "news"
            ? await loadNewsById(id)
            : await loadPostById(id);

        if (mounted) {
          setItem(toDetailItem(kind, payload));
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load this article.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      mounted = false;
    };
  }, [id, kind]);

  useEffect(() => {
    let mounted = true;

    const loadRelatedItems = async () => {
      setRelatedLoading(true);

      try {
        const payload: Array<PostItem | NewsItem | EventItem> =
          kind === "event" ? await loadUpcomingEvents() : kind === "news" ? await loadNews() : await loadPosts();

        if (!mounted) {
          return;
        }

        const currentId = id || item?.id;
        const nextItems = sortNewestFirst(payload)
          .filter((relatedItem) => getItemId(relatedItem) !== currentId)
          .slice(0, 5)
          .map((relatedItem) => toRelatedItem(kind, relatedItem));

        setRelatedItems(nextItems);
      } catch {
        if (mounted) {
          setRelatedItems([]);
        }
      } finally {
        if (mounted) {
          setRelatedLoading(false);
        }
      }
    };

    void loadRelatedItems();

    return () => {
      mounted = false;
    };
  }, [id, item?.id, kind]);

  const blocks = useMemo(() => parseBodyBlocks(item?.body || ""), [item?.body]);
  const storyText = useMemo(() => stripHtml(item?.body || ""), [item?.body]);
  const articleImages = useMemo(() => {
    const inlineImages = blocks.filter((block) => block.type === "image").map((block) => block.src);
    return uniqueImages([item?.image || "", ...(item?.images || []), ...inlineImages]);
  }, [blocks, item?.image, item?.images]);

  const heroImage = item?.image || articleImages[0] || "";
  const excerpt = storyText || "Explore the full story, images, and editorial details from Reality Life Magazine.";
  const bodyHeading = kind === "event" ? "About this event" : kind === "news" ? "News story" : "Feature story";
  const contextLabel = kind === "event" ? "Experience" : kind === "news" ? "Newsroom" : "Lifestyle";
  const contentImageFit = kind === "event" ? "contain" : "cover";
  const contentImageBg = kind === "event" ? "#0f1712" : "#15130f";

  const handleDeleteEvent = async () => {
    if (kind !== "event" || !item?.id) {
      setFeedback({ severity: "error", message: "This event cannot be deleted because it has no database id." });
      return;
    }

    setIsDeleting(true);

    try {
      await requestJson<{ message: string }>(
        UPCOMING_EVENTS_ENDPOINTS.map((endpoint) => `${endpoint}/${item.id}`),
        { method: "DELETE" },
        "Unable to delete upcoming event."
      );

      setDeleteDialogOpen(false);
      setFeedback({ severity: "success", message: "Upcoming event deleted successfully." });
      window.setTimeout(() => navigate("/events"), 650);
    } catch (deleteError) {
      setFeedback({
        severity: "error",
        message: deleteError instanceof Error ? deleteError.message : "Unable to delete upcoming event.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: pageBg, color: "#fff", overflow: "hidden" }}>
        <Box
          sx={{
            position: "relative",
            py: { xs: 3, md: 5 },
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            bgcolor: deepGreen,
            isolation: "isolate",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, rgba(8,8,6,0.92) 0%, rgba(18,55,42,0.9) 46%, rgba(166,124,27,0.42) 100%)",
              zIndex: -2,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: "auto 0 0",
              height: 130,
              background: "linear-gradient(180deg, transparent, #080806)",
              zIndex: -1,
            },
          }}
        >
          {heroImage && (
            <Box
              component="img"
              src={heroImage}
              alt=""
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.18,
                zIndex: -3,
              }}
            />
          )}

          <Container maxWidth="lg">
            <Button
              component={RouterLink}
              to={backPath}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: ivory,
                textTransform: "none",
                fontWeight: 800,
                mb: { xs: 3, md: 5 },
                px: 0,
                "&:hover": { bgcolor: "transparent", color: "#f1d68a" },
              }}
            >
              Back
            </Button>

            {loading && (
              <ContentLoader title="Loading Article" subtitle="Fetching the full story from the backend." />
            )}

            {!loading && error && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "rgba(166,124,27,0.14)",
                  border: "1px solid rgba(241,214,138,0.26)",
                  color: "#f1d68a",
                }}
              >
                {error}
              </Paper>
            )}

            {!loading && !error && item && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.94fr) minmax(300px, 0.56fr)" },
                  gap: { xs: 4, md: 6 },
                  alignItems: "end",
                  minHeight: { md: 540 },
                }}
              >
                <Box sx={{ pb: { xs: 0, md: 5 } }}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                    <Chip
                      label={item.label}
                      sx={{ bgcolor: gold, color: "#fff", fontWeight: 900, borderRadius: 1.5 }}
                    />
                    <Chip
                      label={contextLabel}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: ivory,
                        border: "1px solid rgba(255,255,255,0.16)",
                        fontWeight: 900,
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>

                  <Typography
                    component="h1"
                    sx={{
                      fontSize: { xs: 38, sm: 52, md: 72 },
                      lineHeight: 0.98,
                      fontWeight: 950,
                      maxWidth: 900,
                      letterSpacing: 0,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#efe6d2",
                      lineHeight: 1.8,
                      fontSize: { xs: 16, md: 18 },
                      mt: 3,
                      maxWidth: 720,
                    }}
                  >
                    {excerpt}
                  </Typography>
                </Box>

                {heroImage && (
                  <Paper
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 2,
                      bgcolor: "#111",
                      border: "1px solid rgba(255,255,255,0.16)",
                      boxShadow: "0 28px 70px rgba(0,0,0,0.38)",
                    }}
                  >
                    <Box
                      component="img"
                      src={heroImage}
                      alt={item.title}
                      sx={{
                        width: "100%",
                        aspectRatio: { xs: "4 / 3", md: "1 / 1" },
                        objectFit: contentImageFit,
                        bgcolor: contentImageBg,
                        display: "block",
                      }}
                    />
                  </Paper>
                )}
              </Box>
            )}
          </Container>
        </Box>

        {!loading && !error && item && (
          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
                gap: { xs: 3, md: 5 },
                alignItems: "start",
              }}
            >
              <Box sx={{ display: "grid", gap: 2, position: { md: "sticky" }, top: { md: 24 } }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "#11110f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                  }}
                >
                  <Typography sx={{ color: "#f1d68a", fontSize: 13, fontWeight: 900, textTransform: "uppercase", mb: 2 }}>
                    Story details
                  </Typography>

                  {[
                    { icon: <CalendarTodayIcon fontSize="small" />, label: "Published", value: formatDate(item.createdAt) },
                    { icon: <AccessTimeIcon fontSize="small" />, label: "Reading time", value: getReadingTime(item.body) },
                    { icon: <PersonIcon fontSize="small" />, label: "Source", value: "Reality Life Magazine" },
                  ].map((detail, index) => (
                    <Box key={detail.label}>
                      {index > 0 && <Divider sx={{ my: 1.75, borderColor: "rgba(255,255,255,0.12)" }} />}
                      <Box sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.25, alignItems: "center" }}>
                        <Box sx={{ color: gold, display: "flex" }}>{detail.icon}</Box>
                        <Box>
                          <Typography sx={{ color: "#9ba39d", fontSize: 12, fontWeight: 800 }}>
                            {detail.label}
                          </Typography>
                          <Typography sx={{ color: ivory, fontWeight: 900 }}>{detail.value}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  {kind === "event" && (
                    <>
                      <Divider sx={{ my: 1.75, borderColor: "rgba(255,255,255,0.12)" }} />
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                        <Box>
                          <Typography sx={{ color: "#9ba39d", fontSize: 12, fontWeight: 800 }}>
                            Admin action
                          </Typography>
                          <Typography sx={{ color: ivory, fontWeight: 900 }}>Delete event</Typography>
                        </Box>
                        <IconButton
                          aria-label={`Delete ${item.title}`}
                          onClick={() => setDeleteDialogOpen(true)}
                          disabled={isDeleting}
                          sx={{
                            color: "#ffb4a9",
                            border: "1px solid rgba(255,180,169,0.44)",
                            borderRadius: 1.25,
                            "&:hover": { bgcolor: "rgba(180,35,24,0.18)", borderColor: "#ffb4a9" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "#f4efe4",
                    color: "#171410",
                    border: "1px solid rgba(166,124,27,0.26)",
                  }}
                >
                  <Box sx={{ display: "flex", color: deepGreen, gap: 1.2, mb: 1.5 }}>
                    <TerrainIcon />
                    <LocalDiningIcon />
                  </Box>
                  <Typography sx={{ fontWeight: 950, fontSize: 20, lineHeight: 1.12 }}>
                    Culture, hospitality, and place in one polished read.
                  </Typography>
                </Paper>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 4, md: 5 },
                  borderRadius: 2,
                  bgcolor: ivory,
                  color: "#15130f",
                  border: "1px solid rgba(166,124,27,0.2)",
                  boxShadow: "0 24px 65px rgba(0,0,0,0.24)",
                }}
              >
                <Typography
                  component="h2"
                  sx={{ fontSize: { xs: 26, md: 38 }, lineHeight: 1.08, fontWeight: 950, mb: 3 }}
                >
                  {bodyHeading}
                </Typography>

                <Box sx={{ display: "grid", gap: { xs: 2.25, md: 3 } }}>
                  {blocks.map((block, index) =>
                    block.type === "image" ? (
                      <Paper
                        key={`${block.src}-${index}`}
                        elevation={0}
                        sx={{
                          my: 1,
                          overflow: "hidden",
                          borderRadius: 2,
                          bgcolor: contentImageBg,
                          border: "1px solid rgba(166,124,27,0.2)",
                        }}
                      >
                        <Box
                          component="img"
                          src={block.src}
                          alt={block.alt || item.title}
                          sx={{
                            width: "100%",
                            maxHeight: 620,
                            objectFit: contentImageFit,
                            display: "block",
                          }}
                        />
                      </Paper>
                    ) : (
                      <Typography
                        key={`${block.value}-${index}`}
                        sx={{
                          color: "#38332b",
                          lineHeight: 1.95,
                          fontSize: { xs: 16, md: 18 },
                        }}
                      >
                        {block.value}
                      </Typography>
                    )
                  )}
                </Box>
              </Paper>
            </Box>

            {articleImages.length > 1 && (
              <Box sx={{ mt: { xs: 4, md: 6 } }}>
                <Typography sx={{ color: ivory, fontSize: { xs: 24, md: 34 }, fontWeight: 950, mb: 2 }}>
                  More from this story
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  {articleImages.slice(1).map((image, index) => (
                    <Paper
                      key={`${image}-${index}`}
                      elevation={0}
                      sx={{
                        overflow: "hidden",
                        borderRadius: 2,
                        bgcolor: "#111",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt={`${item.title} ${index + 2}`}
                        sx={{
                          width: "100%",
                          aspectRatio: "4 / 3",
                          objectFit: contentImageFit,
                          bgcolor: contentImageBg,
                          display: "block",
                        }}
                      />
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {(relatedLoading || relatedItems.length > 0) && (
              <Box sx={{ mt: { xs: 5, md: 7 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "end" },
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 2.5,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box>
                    <Typography
                      sx={{ color: "#f1d68a", fontSize: 13, fontWeight: 900, textTransform: "uppercase", mb: 0.8 }}
                    >
                      Latest from this section
                    </Typography>
                    <Typography sx={{ color: ivory, fontSize: { xs: 26, md: 38 }, fontWeight: 950, lineHeight: 1.06 }}>
                      Related Posts
                    </Typography>
                  </Box>

                  <Button
                    component={RouterLink}
                    to={backPath}
                    sx={{
                      color: "#171410",
                      bgcolor: "#f1d68a",
                      borderRadius: 1.5,
                      px: 2.4,
                      py: 1,
                      fontWeight: 900,
                      textTransform: "none",
                      "&:hover": { bgcolor: gold, color: "#fff" },
                    }}
                  >
                    View all
                  </Button>
                </Box>

                {relatedLoading && relatedItems.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: "#11110f",
                      color: "#d7d0c4",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Loading related posts...
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(5, minmax(0, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    {relatedItems.map((relatedItem) => (
                      <Paper
                        key={relatedItem.id || relatedItem.title}
                        component={RouterLink}
                        to={relatedItem.path}
                        elevation={0}
                        sx={{
                          display: "flex",
                          minWidth: 0,
                          minHeight: 330,
                          flexDirection: "column",
                          overflow: "hidden",
                          borderRadius: 2,
                          bgcolor: "#f4efe4",
                          color: "#171410",
                          border: "1px solid rgba(166,124,27,0.24)",
                          textDecoration: "none",
                          transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                          "&:hover": {
                            transform: "translateY(-6px)",
                            borderColor: gold,
                            boxShadow: "0 18px 36px rgba(0,0,0,0.28)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            bgcolor: "#171410",
                            aspectRatio: "4 / 3",
                            overflow: "hidden",
                          }}
                        >
                          {relatedItem.image ? (
                            <Box
                              component="img"
                              src={relatedItem.image}
                              alt={relatedItem.title}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: kind === "event" ? "contain" : "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <Box sx={{ width: "100%", height: "100%", bgcolor: deepGreen }} />
                          )}
                          <Chip
                            label={relatedItem.label}
                            size="small"
                            sx={{
                              position: "absolute",
                              left: 12,
                              top: 12,
                              bgcolor: gold,
                              color: "#fff",
                              fontWeight: 900,
                              borderRadius: 1.2,
                            }}
                          />
                        </Box>

                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", flex: 1 }}>
                          <Typography sx={{ color: deepGreen, fontSize: 12, fontWeight: 900, mb: 1 }}>
                            {formatDate(relatedItem.createdAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 18, lineHeight: 1.18, fontWeight: 950, mb: 1.2 }}>
                            {relatedItem.title}
                          </Typography>
                          <Typography
                            sx={{
                              color: "#665f51",
                              fontSize: 14,
                              lineHeight: 1.6,
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                              overflow: "hidden",
                            }}
                          >
                            {relatedItem.excerpt}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Container>
        )}
      </Box>
      <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Delete event?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#4a4f58", lineHeight: 1.7 }}>
            Do you want to delete "{item?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{ color: "#4a4f58", fontWeight: 800, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteEvent}
            disabled={isDeleting}
            startIcon={<DeleteIcon />}
            sx={{
              bgcolor: "#b42318",
              color: "#fff",
              fontWeight: 900,
              textTransform: "none",
              "&:hover": { bgcolor: "#912018" },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} variant="filled">
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
      <Footer />
    </>
  );
};

export default ContentDetailScreen;
