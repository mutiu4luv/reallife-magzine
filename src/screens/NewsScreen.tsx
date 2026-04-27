import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Pagination,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import ContentLoader from "../components/ContentLoader";
import { loadNews, type NewsItem } from "../services/contentApi";

const gold = "#A67C1B";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
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
  const [page, setPage] = useState(1);
  const isSmallScreen = useMediaQuery("(max-width:899px)");
  const pageSize = isSmallScreen ? 10 : 20;

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

    return news.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query));
  }, [news, searchTerm]);

  const pageCount = Math.max(Math.ceil(filteredNews.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNews.slice(start, start + pageSize);
  }, [currentPage, filteredNews, pageSize]);

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", py: 6 }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800, textAlign: "center", mb: 1 }}>
              RealityLife News
            </Typography>
            <Typography sx={{ textAlign: "center", color: "#aaa", mb: 6, maxWidth: 650, mx: "auto" }}>
              Follow the latest stories, features, interviews, and community updates from the backend.
            </Typography>
          </motion.div>

          {loading && <ContentLoader title="Loading RealityLife News" subtitle="Fetching the latest news from the backend." />}

          {error && !loading && (
            <Paper elevation={0} sx={{ maxWidth: 680, mx: "auto", mb: 4, p: 3, borderRadius: 2, bgcolor: "rgba(166,124,27,0.12)", border: "1px solid rgba(166,124,27,0.32)", color: "#f1d68a", textAlign: "center" }}>
              {error}. No news is available right now.
            </Paper>
          )}

          {!loading && !error && news.length === 0 && (
            <Paper elevation={0} sx={{ maxWidth: 680, mx: "auto", mb: 4, p: 3, borderRadius: 2, bgcolor: "#111", border: "1px solid rgba(255,255,255,0.12)", color: "#ddd", textAlign: "center" }}>
              No news has been published yet.
            </Paper>
          )}

          {!loading && !error && news.length > 0 && (
            <Paper elevation={0} sx={{ mb: 4, p: { xs: 2, sm: 2.5 }, borderRadius: 2, bgcolor: "#111", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
              <TextField
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search news by title or description"
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
                sx={{ maxWidth: { xs: "100%", md: 460 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 } }}
              />

              <Typography sx={{ color: "#c9c9c9", fontWeight: 700, textAlign: { xs: "left", md: "right" } }}>
                Showing {paginatedNews.length} of {filteredNews.length} news
              </Typography>
            </Paper>
          )}

          {!loading && !error && news.length > 0 && filteredNews.length === 0 && (
            <Paper elevation={0} sx={{ maxWidth: 680, mx: "auto", mb: 4, p: 3, borderRadius: 2, bgcolor: "#111", border: "1px solid rgba(255,255,255,0.12)", color: "#ddd", textAlign: "center" }}>
              No news matches "{searchTerm}".
            </Paper>
          )}

          <Box sx={{ display: loading || error ? "none" : "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>
            {paginatedNews.map((item, index) => {
              const itemId = item._id || item.id;

              return (
                <motion.div key={itemId || `${item.title}-${currentPage}-${index}`} initial="hidden" whileInView="show" viewport={{ once: false }} variants={fadeUp} style={{ display: "flex" }}>
                  <Paper elevation={0} sx={{ width: "100%", borderRadius: 5, overflow: "hidden", bgcolor: "#f7f7fa", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(34,34,34,0.10)", border: "1.5px solid #ececec", transition: "0.3s", minHeight: 420, "&:hover": { transform: "translateY(-10px) scale(1.03)", boxShadow: `0 16px 40px ${gold}22`, borderColor: gold } }}>
                    <Box component="img" src={item.image} alt={item.title} sx={{ width: "100%", height: 180, objectFit: "cover" }} />
                    <Box sx={{ p: 3, display: "flex", flexDirection: "column", flex: 1 }}>
                      <Chip label={formatDate(item.createdAt)} size="small" sx={{ alignSelf: "flex-start", mb: 1.5, bgcolor: gold, color: "#fff", fontWeight: 700 }} />
                      <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>{item.title}</Typography>
                      <Typography sx={{ color: "#555", fontSize: 15, flex: 1 }}>{item.description}</Typography>
                      <Button component={RouterLink} to={`/news/${itemId}`} disabled={!itemId} sx={{ mt: 2, alignSelf: "flex-start", color: gold, fontWeight: 700, textTransform: "none", border: `1px solid ${gold}`, "&:hover": { bgcolor: gold, color: "#fff" } }}>
                        Read Article →
                      </Button>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>

          {!loading && !error && filteredNews.length > pageSize && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <Pagination count={pageCount} page={currentPage} onChange={(_, value) => setPage(value)} color="primary" siblingCount={isSmallScreen ? 0 : 1} boundaryCount={1} sx={{ "& .MuiPaginationItem-root": { color: "#fff", borderColor: "rgba(255,255,255,0.24)" }, "& .Mui-selected": { bgcolor: `${gold} !important`, color: "#fff" } }} />
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default NewsScreen;
