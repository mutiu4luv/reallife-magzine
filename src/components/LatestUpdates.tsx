import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Container, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { loadNews, loadPosts, loadUpcomingEvents, type EventItem, type NewsItem, type PostItem } from "../services/contentApi";
import { toExcerpt } from "../utils/contentText";

const gold = "#A67C1B";

type LatestItem = {
  id?: string;
  label: string;
  title: string;
  description: string;
  image: string;
  date?: string;
  href: string;
  allHref: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const getTime = (value?: string) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

const latestByDate = <T extends { createdAt?: string }>(items: T[]) =>
  [...items].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))[0];

const formatDate = (value?: string) => {
  if (!value) {
    return "Latest";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const postToLatestItem = (post?: PostItem): LatestItem | null => {
  if (!post) {
    return null;
  }

  const id = post._id || post.id;
  return {
    id,
    label: post.type || "Blog",
    title: post.title,
    description: post.desc || post.description || "",
    image: post.image || post.images?.[0] || "",
    date: post.createdAt,
    href: id ? `/blog/${id}` : "/blog",
    allHref: "/blog",
  };
};

const newsToLatestItem = (news?: NewsItem): LatestItem | null => {
  if (!news) {
    return null;
  }

  const id = news._id || news.id;
  return {
    id,
    label: "News",
    title: news.title,
    description: news.description || news.desc || "",
    image: news.image,
    date: news.createdAt,
    href: id ? `/news/${id}` : "/news",
    allHref: "/news",
  };
};

const eventToLatestItem = (eventItem?: EventItem): LatestItem | null => {
  if (!eventItem) {
    return null;
  }

  const id = eventItem._id || eventItem.id;
  return {
    id,
    label: "Event",
    title: eventItem.title,
    description: eventItem.description || eventItem.desc || "",
    image: eventItem.images?.[0] || "",
    date: eventItem.createdAt,
    href: id ? `/events/${id}` : "/events",
    allHref: "/events",
  };
};

const LatestUpdates: React.FC = () => {
  const [items, setItems] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadLatest = async () => {
      const [postsResult, newsResult, eventsResult] = await Promise.allSettled([
        loadPosts(),
        loadNews(),
        loadUpcomingEvents(),
      ]);

      if (!mounted) {
        return;
      }

      const latestItems = [
        postsResult.status === "fulfilled" ? postToLatestItem(latestByDate(postsResult.value)) : null,
        newsResult.status === "fulfilled" ? newsToLatestItem(latestByDate(newsResult.value)) : null,
        eventsResult.status === "fulfilled" ? eventToLatestItem(latestByDate(eventsResult.value)) : null,
      ].filter((item): item is LatestItem => Boolean(item));

      setItems(latestItems);
      setLoading(false);
    };

    void loadLatest();

    return () => {
      mounted = false;
    };
  }, []);

  const sectionSubtitle = useMemo(() => {
    if (loading) {
      return "Fetching the latest blog, news, and event updates.";
    }

    return items.length > 0
      ? "The newest blog, news, and event updates are highlighted here while remaining available in their original sections."
      : "Latest blog, news, and event updates will appear here once published.";
  }, [items.length, loading]);

  return (
    <Box component="section" sx={{ bgcolor: "#080806", color: "#fff", py: { xs: 5, md: 7 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "end" }, justifyContent: "space-between", gap: 2, mb: 3, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography sx={{ color: gold, fontWeight: 900, textTransform: "uppercase", fontSize: 13, mb: 1 }}>
              Latest Updates
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 950, fontSize: { xs: 31, md: 45 }, lineHeight: 1.05 }}>
              Latest Blog, News and Event
            </Typography>
            <Typography sx={{ color: "#c9c9c9", mt: 1.5, maxWidth: 680, lineHeight: 1.7 }}>
              {sectionSubtitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
          {(loading ? [0, 1, 2] : items).map((item, index) => {
            const isLoadingCard = typeof item === "number";

            return (
              <motion.div key={isLoadingCard ? item : `${item.label}-${item.id || item.title}`} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ delay: index * 0.08 }}>
                <Paper elevation={0} sx={{ height: "100%", minHeight: 390, overflow: "hidden", borderRadius: 2, bgcolor: "#f7f7fa", border: "1px solid rgba(166,124,27,0.18)", display: "flex", flexDirection: "column" }}>
                  {isLoadingCard ? (
                    <Box sx={{ height: 190, bgcolor: "#161616" }} />
                  ) : item.image ? (
                    <Box component="img" src={item.image} alt={item.title} loading="lazy" decoding="async" sx={{ width: "100%", height: 190, objectFit: "cover", display: "block", bgcolor: "#15130f" }} />
                  ) : (
                    <Box sx={{ height: 190, bgcolor: "#15130f", color: "#f1d68a", display: "grid", placeItems: "center", fontWeight: 950 }}>
                      RealityLife
                    </Box>
                  )}

                  <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
                    {isLoadingCard ? (
                      <>
                        <Box sx={{ width: 94, height: 24, borderRadius: 1, bgcolor: "rgba(166,124,27,0.18)", mb: 2 }} />
                        <Box sx={{ width: "86%", height: 24, borderRadius: 1, bgcolor: "rgba(0,0,0,0.12)", mb: 1 }} />
                        <Box sx={{ width: "100%", height: 56, borderRadius: 1, bgcolor: "rgba(0,0,0,0.08)", mt: 1 }} />
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                          <Chip label={item.label} size="small" sx={{ bgcolor: gold, color: "#fff", fontWeight: 800 }} />
                          <Chip label={formatDate(item.date)} size="small" sx={{ bgcolor: "#ece5d3", color: "#3a2b0d", fontWeight: 800 }} />
                        </Box>
                        <Typography sx={{ color: "#15130f", fontWeight: 900, fontSize: 20, lineHeight: 1.18, mb: 1 }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: "#555", fontSize: 15, lineHeight: 1.7, flex: 1, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}>
                          {toExcerpt(item.description, 145)}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                          <Button component={RouterLink} to={item.href} sx={{ color: gold, fontWeight: 800, textTransform: "none", border: `1px solid ${gold}`, "&:hover": { bgcolor: gold, color: "#fff" } }}>
                            Read Article
                          </Button>
                          <Button component={RouterLink} to={item.allHref} sx={{ color: "#3f3a2e", fontWeight: 800, textTransform: "none" }}>
                            View All
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default LatestUpdates;
