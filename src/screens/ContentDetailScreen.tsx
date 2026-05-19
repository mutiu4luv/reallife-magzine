import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import PersonIcon from "@mui/icons-material/Person";
import ShareIcon from "@mui/icons-material/Share";
import TerrainIcon from "@mui/icons-material/Terrain";
import Footer from "../components/Footer";
import ContentLoader from "../components/ContentLoader";
import { shareContent } from "../utils/share";
import { stripHtml, toExcerpt } from "../utils/contentText";
import {
  loadNews,
  loadNewsById,
  loadPosts,
  loadPostById,
  loadUpcomingEvents,
  loadUpcomingEventById,
  type EventItem,
  type NewsItem,
  type PostItem,
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

type RelatedItem = {
  id?: string;
  title: string;
  excerpt: string;
  image: string;
  label: string;
  path: string;
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
      image: news.image || news.images?.[0] || "",
      images: news.images || (news.image ? [news.image] : []),
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

const toRelatedItem = (kind: DetailKind, item: PostItem | NewsItem | EventItem): RelatedItem | null => {
  const detail = toDetailItem(kind, item);

  if (!detail.id) {
    return null;
  }

  return {
    id: detail.id,
    title: detail.title,
    excerpt: toExcerpt(stripHtml(detail.body), 96),
    image: detail.image || detail.images?.[0] || "",
    label: detail.label,
    path: getRelatedPath(kind, detail.id),
  };
};

const backPathByKind = (kind: DetailKind) => {
  if (kind === "event") {
    return "/events";
  }

  return kind === "news" ? "/news" : "/blog";
};

const ContentDetailScreen: React.FC<ContentDetailScreenProps> = ({ kind }) => {
  const { id } = useParams();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);

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

        try {
          const relatedPayload = kind === "event" ? await loadUpcomingEvents() : kind === "news" ? await loadNews() : await loadPosts();
          if (!mounted) {
            return;
          }

          setRelatedItems(
            relatedPayload
              .map((relatedItem) => toRelatedItem(kind, relatedItem))
              .filter((relatedItem): relatedItem is RelatedItem => relatedItem !== null)
              .filter((relatedItem) => relatedItem.id !== id)
              .slice(0, 3)
          );
        } catch {
          if (mounted) {
            setRelatedItems([]);
          }
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

  const blocks = useMemo(() => parseBodyBlocks(item?.body || ""), [item?.body]);
  const storyText = useMemo(() => stripHtml(item?.body || ""), [item?.body]);
  const articleImages = useMemo(() => {
    const inlineImages = blocks.filter((block) => block.type === "image").map((block) => block.src);
    return uniqueImages([item?.image || "", ...(item?.images || []), ...inlineImages]);
  }, [blocks, item?.image, item?.images]);
  const storyBlocks = useMemo(() => {
    const inlineImages = blocks.filter((block) => block.type === "image").map((block) => block.src);
    const extraImages = uniqueImages(item?.images || []).filter(
      (image) => image !== item?.image && !inlineImages.includes(image)
    );

    if (!extraImages.length) {
      return blocks;
    }

    let nextImageIndex = 0;
    const mixedBlocks: ContentBlock[] = [];

    blocks.forEach((block) => {
      mixedBlocks.push(block);

      if (block.type === "paragraph" && nextImageIndex < extraImages.length) {
        mixedBlocks.push({ type: "image", src: extraImages[nextImageIndex], alt: item?.title || "" });
        nextImageIndex += 1;
      }
    });

    extraImages.slice(nextImageIndex).forEach((image) => {
      mixedBlocks.push({ type: "image", src: image, alt: item?.title || "" });
    });

    return mixedBlocks;
  }, [blocks, item?.image, item?.images, item?.title]);

  const heroImage = item?.image || articleImages[0] || "";
  const excerpt =
    toExcerpt(storyText, 180) || "Explore the full story, images, and editorial details from Reality Life Magazine.";
  const bodyHeading = kind === "event" ? "About this event" : kind === "news" ? "News story" : "Feature story";
  const contextLabel = kind === "event" ? "Experience" : kind === "news" ? "Newsroom" : "Lifestyle";
  const contentImageFit = kind === "event" ? "contain" : "cover";
  const contentImageBg = kind === "event" ? "#0f1712" : "#15130f";
  const sharePath = id ? getRelatedPath(kind, id) : backPath;

  const handleShare = async () => {
    if (!item) {
      return;
    }

    try {
      const result = await shareContent({
        title: item.title,
        text: excerpt,
        path: sharePath,
      });
      setShareMessage(result === "copied" ? "Link copied to clipboard." : "Share sheet opened.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      setShareMessage("Unable to share this link.");
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
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5, alignItems: "center" }}>
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
                    <Button
                      onClick={handleShare}
                      startIcon={<ShareIcon />}
                      sx={{
                        minHeight: 32,
                        borderRadius: 1.5,
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: ivory,
                        border: "1px solid rgba(255,255,255,0.16)",
                        px: 1.4,
                        textTransform: "none",
                        fontWeight: 900,
                        "&:hover": { bgcolor: "#f1d68a", color: "#171410" },
                      }}
                    >
                      Share
                    </Button>
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

                  <Button
                    fullWidth
                    onClick={handleShare}
                    startIcon={<ShareIcon />}
                    sx={{
                      mt: 2.25,
                      borderRadius: 1.5,
                      bgcolor: "#f1d68a",
                      color: "#171410",
                      textTransform: "none",
                      fontWeight: 900,
                      "&:hover": { bgcolor: gold, color: "#fff" },
                    }}
                  >
                    Share this {kind === "event" ? "event" : "story"}
                  </Button>
                  {shareMessage && (
                    <Typography sx={{ color: "#c8b98f", fontSize: 12, fontWeight: 800, mt: 1.2 }}>
                      {shareMessage}
                    </Typography>
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
                   Lifestyle, Culture, hospitality, and place in one polished read.
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
                  {storyBlocks.map((block, index) =>
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

            {relatedItems.length > 0 && (
              <Box sx={{ mt: { xs: 5, md: 7 } }}>
                <Typography sx={{ color: ivory, fontSize: { xs: 24, md: 34 }, fontWeight: 950, mb: 2.5 }}>
                  Related {kind === "event" ? "events" : kind === "news" ? "news" : "articles"}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 2.2,
                  }}
                >
                  {relatedItems.map((relatedItem) => (
                    <Paper
                      key={relatedItem.id}
                      component={RouterLink}
                      to={relatedItem.path}
                      elevation={0}
                      sx={{
                        overflow: "hidden",
                        borderRadius: 2,
                        bgcolor: "#11110f",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: ivory,
                        textDecoration: "none",
                        transition: "transform 180ms ease, border-color 180ms ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          borderColor: "rgba(241,214,138,0.44)",
                        },
                      }}
                    >
                      {relatedItem.image && (
                        <Box
                          component="img"
                          src={relatedItem.image}
                          alt={relatedItem.title}
                          sx={{
                            width: "100%",
                            aspectRatio: "4 / 3",
                            objectFit: "cover",
                            bgcolor: contentImageBg,
                            display: "block",
                          }}
                        />
                      )}
                      <Box sx={{ p: 2.2 }}>
                        <Chip
                          size="small"
                          label={relatedItem.label}
                          sx={{ bgcolor: "rgba(241,214,138,0.14)", color: "#f1d68a", fontWeight: 900, mb: 1.4 }}
                        />
                        <Typography sx={{ fontSize: 18, lineHeight: 1.2, fontWeight: 950, mb: 1 }}>
                          {relatedItem.title}
                        </Typography>
                        <Typography sx={{ color: "#c8b98f", lineHeight: 1.65, fontSize: 14 }}>
                          {relatedItem.excerpt}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

          </Container>
        )}
      </Box>
      <Footer />
    </>
  );
};

export default ContentDetailScreen;
