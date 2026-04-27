import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { loadNews, type NewsItem } from "../services/contentApi";

const gold = "#caa64a";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

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

const NewsScreen: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const items = await loadNews();
        if (mounted) {
          setNews(items);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load news.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredNews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return news;
    }

    return news.filter((item) => {
      const content = `${item.title} ${item.description}`.toLowerCase();
      return content.includes(query);
    });
  }, [news, searchTerm]);

  const leadStory = filteredNews[0];
  const remainingStories = filteredNews.slice(1);

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0b0b0c", color: "#fff", pb: { xs: 6, md: 9 } }}>
        <Box
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background:
              "linear-gradient(135deg, rgba(202,166,74,0.22), rgba(11,11,12,0.96) 44%), #0b0b0c",
            pt: { xs: 6, md: 8 },
            pb: { xs: 5, md: 7 },
          }}
        >
          <Container maxWidth="lg">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <Chip
                label="RealityLife Newsroom"
                sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900, mb: 2 }}
              />
              <Typography sx={{ fontSize: { xs: 38, md: 64 }, lineHeight: 1, fontWeight: 950, maxWidth: 760 }}>
                News that keeps the community in focus.
              </Typography>
              <Typography sx={{ color: "#d7d9de", mt: 2, maxWidth: 680, fontSize: { xs: 16, md: 18 }, lineHeight: 1.7 }}>
                Follow the latest RealityLife stories, features, interviews, and community updates.
              </Typography>
            </motion.div>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 5 } }}>
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              bgcolor: "#15161a",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search news"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: gold }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1.5,
                },
              }}
            />
          </Paper>

          {loading && (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
              <CircularProgress sx={{ color: gold }} />
            </Box>
          )}

          {!loading && error && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#17120b", color: "#f1d68a" }}>
              {error}. No news is available right now.
            </Paper>
          )}

          {!loading && !error && filteredNews.length === 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#15161a", color: "#d7d9de" }}>
              No news items match your search.
            </Paper>
          )}

          {!loading && !error && leadStory && (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  bgcolor: "#f7f7fa",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.12fr 0.88fr" },
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <Box component="img" src={leadStory.image} alt={leadStory.title} sx={{ width: "100%", height: { xs: 300, md: 470 }, objectFit: "cover" }} />
                <Box sx={{ p: { xs: 3, md: 5 }, color: "#121417", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Chip label={formatDate(leadStory.createdAt)} sx={{ alignSelf: "flex-start", bgcolor: "#111318", color: "#fff", fontWeight: 900, mb: 2 }} />
                  <Typography sx={{ fontWeight: 950, fontSize: { xs: 28, md: 42 }, lineHeight: 1.05 }}>
                    {leadStory.title}
                  </Typography>
                  <Typography sx={{ mt: 2, color: "#4b5563", lineHeight: 1.8, fontSize: 16 }}>
                    {leadStory.description}
                  </Typography>
                </Box>
              </Paper>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                  gap: 3,
                }}
              >
                {remainingStories.map((item, index) => (
                  <motion.div key={item._id || item.id || `${item.title}-${index}`} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                    <Paper elevation={0} sx={{ height: "100%", overflow: "hidden", borderRadius: 2, bgcolor: "#f7f7fa", color: "#121417", border: "1px solid #ececec" }}>
                      <Box component="img" src={item.image} alt={item.title} sx={{ width: "100%", height: 210, objectFit: "cover" }} />
                      <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ color: "#6f5517", fontSize: 13, fontWeight: 900, mb: 1 }}>
                          {formatDate(item.createdAt)}
                        </Typography>
                        <Typography sx={{ fontSize: 21, fontWeight: 950, lineHeight: 1.15 }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ mt: 1.5, color: "#566070", lineHeight: 1.7 }}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default NewsScreen;
