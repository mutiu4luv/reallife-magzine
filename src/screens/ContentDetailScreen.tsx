import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Box, Button, Chip, Container, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Footer from "../components/Footer";
import ContentLoader from "../components/ContentLoader";
import {
  loadNewsById,
  loadPostById,
  loadUpcomingEventById,
  type EventItem,
  type NewsItem,
  type PostItem,
} from "../services/contentApi";

const gold = "#A67C1B";

type DetailKind = "post" | "news" | "event";

type DetailItem = {
  title: string;
  body: string;
  image: string;
  images?: string[];
  label: string;
  createdAt?: string;
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

const toDetailItem = (kind: DetailKind, item: PostItem | NewsItem | EventItem): DetailItem => {
  if (kind === "event") {
    const event = item as EventItem;
    return {
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
      title: news.title,
      body: news.description || news.desc || "",
      image: news.image,
      label: "News",
      createdAt: news.createdAt,
    };
  }

  const post = item as PostItem;
  return {
    title: post.title,
    body: post.desc || post.description || "",
    image: post.image || post.images?.[0] || "",
    images: post.images || (post.image ? [post.image] : []),
    label: post.type || "Article",
    createdAt: post.createdAt,
  };
};

const ContentDetailScreen: React.FC<ContentDetailScreenProps> = ({ kind }) => {
  const { id } = useParams();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backPath = useMemo(() => {
    if (kind === "event") {
      return "/events";
    }

    return kind === "news" ? "/news" : "/blog";
  }, [kind]);

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

  const detailIntro =
    kind === "event"
      ? "Event details and images returned directly from the backend."
      : kind === "news"
      ? "News details returned directly from the backend."
      : "Article details returned directly from the backend.";
  const bodyHeading = kind === "event" ? "About this event" : kind === "news" ? "News story" : "Article";

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", color: "#fff", py: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg">
          <Button
            component={RouterLink}
            to={backPath}
            startIcon={<ArrowBackIcon />}
            sx={{ color: "#f1d68a", textTransform: "none", fontWeight: 800, mb: 3 }}
          >
            Back
          </Button>

          {loading && (
            <ContentLoader title="Loading Article" subtitle="Fetching the full story from the backend." />
          )}

          {!loading && error && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "rgba(166,124,27,0.12)", color: "#f1d68a" }}>
              {error}
            </Paper>
          )}

          {!loading && !error && item && (
            <Box sx={{ display: "grid", gap: { xs: 2.5, md: 4 } }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.82fr) minmax(280px, 0.18fr)" },
                  gap: { xs: 2, md: 3 },
                  alignItems: "end",
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    <Chip label={item.label} sx={{ bgcolor: gold, color: "#fff", fontWeight: 900 }} />
                    <Chip label={formatDate(item.createdAt)} sx={{ bgcolor: "#181818", color: "#fff", border: "1px solid rgba(255,255,255,0.14)", fontWeight: 900 }} />
                  </Box>
                  <Typography sx={{ fontSize: { xs: 38, md: 68 }, lineHeight: 0.98, fontWeight: 950, maxWidth: 860 }}>
                    {item.title}
                  </Typography>
                </Box>
                <Typography sx={{ color: "#b8bcc4", lineHeight: 1.8, fontSize: 15 }}>
                  {detailIntro}
                </Typography>
              </Box>

              {item.image && (
                <Paper
                  elevation={0}
                  sx={{
                    overflow: "hidden",
                    borderRadius: 2,
                    bgcolor: "#111",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
                  }}
                >
                  <Box
                    component="img"
                    src={item.image}
                    alt={item.title}
                    sx={{
                      width: "100%",
                      height: { xs: "auto", md: 560 },
                      objectFit: { xs: "contain", md: "cover" },
                      display: "block",
                    }}
                  />
                </Paper>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
                  gap: { xs: 2.5, md: 4 },
                  alignItems: "start",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "#111",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                  }}
                >
                  <Typography sx={{ color: "#8f949f", fontSize: 13, fontWeight: 900, textTransform: "uppercase", mb: 1 }}>
                    Published
                  </Typography>
                  <Typography sx={{ color: "#f1d68a", fontSize: 28, lineHeight: 1, fontWeight: 950 }}>
                    {formatDate(item.createdAt)}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 2,
                    bgcolor: "#f7f7fa",
                    color: "#121417",
                    border: "1px solid #ececec",
                  }}
                >
                  <Typography sx={{ fontSize: { xs: 24, md: 34 }, lineHeight: 1.08, fontWeight: 950, mb: 2 }}>
                    {bodyHeading}
                  </Typography>
                  <Typography sx={{ color: "#3f4652", lineHeight: 1.9, fontSize: { xs: 16, md: 18 }, whiteSpace: "pre-wrap" }}>
                    {item.body}
                  </Typography>
                </Paper>
              </Box>

              {item.images && item.images.length > 1 && (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
                  {item.images.slice(1).map((image, index) => (
                    <Paper key={`${image}-${index}`} elevation={0} sx={{ overflow: "hidden", borderRadius: 2, bgcolor: "#111", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <Box
                        component="img"
                        src={image}
                        alt={`${item.title} ${index + 2}`}
                        sx={{
                          width: "100%",
                          height: { xs: "auto", sm: 230 },
                          objectFit: { xs: "contain", sm: "cover" },
                          display: "block",
                        }}
                      />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default ContentDetailScreen;
