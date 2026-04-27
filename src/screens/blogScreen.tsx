import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  InputAdornment,
  Pagination,
  TextField,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../config/api";

const gold = "#A67C1B";

/* ANIMATION */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

type PostType = "Magazine" | "Book";

type Post = {
  _id?: string;
  title: string;
  type: PostType;
  desc: string;
  image: string;
};

const normalizePosts = (payload: unknown): Post[] => {
  if (Array.isArray(payload)) {
    return payload as Post[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as Post[]) : [];
  }

  return [];
};

const BlogLoader = () => (
  <Paper
    elevation={0}
    sx={{
      position: "relative",
      overflow: "hidden",
      maxWidth: 560,
      mx: "auto",
      my: { xs: 4, md: 6 },
      p: { xs: 4, sm: 5 },
      borderRadius: 2,
      bgcolor: "#111",
      border: "1px solid rgba(166,124,27,0.34)",
      color: "#fff",
      textAlign: "center",
      isolation: "isolate",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: -120,
        background:
          "radial-gradient(circle at 25% 20%, rgba(166,124,27,0.38), transparent 32%), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.12), transparent 28%)",
        animation: "blogLoaderGlow 4.8s ease-in-out infinite alternate",
        zIndex: -1,
      },
      "@keyframes blogLoaderGlow": {
        "0%": { transform: "translate3d(-2%, -2%, 0) scale(1)" },
        "100%": { transform: "translate3d(2%, 2%, 0) scale(1.08)" },
      },
      "@keyframes blogLoaderBar": {
        "0%, 100%": { opacity: 0.35, transform: "scaleX(0.55)" },
        "50%": { opacity: 1, transform: "scaleX(1)" },
      },
    }}
  >
    <Box sx={{ position: "relative", width: 104, height: 104, mx: "auto", mb: 3, display: "grid", placeItems: "center" }}>
      <CircularProgress size={104} thickness={2.5} sx={{ position: "absolute", color: gold }} />
      <CircularProgress
        size={74}
        thickness={2.1}
        variant="determinate"
        value={68}
        sx={{ position: "absolute", color: "rgba(255,255,255,0.22)", transform: "rotate(130deg)" }}
      />
      <Typography sx={{ color: gold, fontWeight: 900, fontSize: 24 }}>RL</Typography>
    </Box>

    <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15 }}>
      Loading RealityLife News
    </Typography>
    <Typography sx={{ color: "#c9c9c9", mt: 1, mb: 3 }}>
      Fetching the latest posts from the backend.
    </Typography>

    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }} aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <Box
          key={item}
          sx={{
            width: 42,
            height: 4,
            borderRadius: 999,
            bgcolor: item === 1 ? gold : "rgba(255,255,255,0.34)",
            transformOrigin: "center",
            animation: `blogLoaderBar 1.15s ease-in-out ${item * 0.16}s infinite`,
          }}
        />
      ))}
    </Box>
  </Paper>
);

const BlogScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const isSmallScreen = useMediaQuery("(max-width:899px)");
  const pageSize = isSmallScreen ? 10 : 20;

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) => post.title.toLowerCase().includes(query));
  }, [posts, searchTerm]);

  const pageCount = Math.max(Math.ceil(filteredPosts.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [currentPage, filteredPosts, pageSize]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        if (!response.ok) {
          throw new Error("Unable to load posts");
        }

        const data = await response.json();
        setPosts(normalizePosts(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load posts");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <>
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", py: 6 }}>
      <Container maxWidth="lg">

        {/* HEADER */}
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <Typography
            variant="h3"
            sx={{
              color: "#fff",
              fontWeight: 800,
              textAlign: "center",
              mb: 1,
              letterSpacing: "-1px",
            }}
          >
RealityLife News          </Typography>

          <Typography
            sx={{
              textAlign: "center",
              color: "#aaa",
              mb: 6,
              maxWidth: 650,
              mx: "auto",
            }}
          >
            Explore powerful stories, curated magazines, and thought-provoking books from RealityLife Magazine.
          </Typography>
        </motion.div>

        {loading && <BlogLoader />}

        {error && !loading && (
          <Paper
            elevation={0}
            sx={{
              maxWidth: 680,
              mx: "auto",
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: "rgba(166,124,27,0.12)",
              border: "1px solid rgba(166,124,27,0.32)",
              color: "#f1d68a",
              textAlign: "center",
            }}
          >
            {error}. No posts are available right now.
          </Paper>
        )}

        {!loading && !error && posts.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              maxWidth: 680,
              mx: "auto",
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ddd",
              textAlign: "center",
            }}
          >
            No posts have been published yet.
          </Paper>
        )}

        {!loading && !error && posts.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              bgcolor: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search posts by title"
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
                maxWidth: { xs: "100%", md: 460 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 2,
                },
              }}
            />

            <Typography sx={{ color: "#c9c9c9", fontWeight: 700, textAlign: { xs: "left", md: "right" } }}>
              Showing {paginatedPosts.length} of {filteredPosts.length} posts
            </Typography>
          </Paper>
        )}

        {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              maxWidth: 680,
              mx: "auto",
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ddd",
              textAlign: "center",
            }}
          >
            No posts match "{searchTerm}".
          </Paper>
        )}

        <Box
          sx={{
            display: loading || error ? "none" : "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
            gap: 3,
          }}
        >
          {paginatedPosts.map((post, i) => (
            <motion.div
              key={post._id || `${post.title}-${currentPage}-${i}`}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false }}
              variants={fadeUp}
              style={{
                display: "flex",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: 5,
                  overflow: "hidden",
                  bgcolor: "#f7f7fa",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 32px rgba(34,34,34,0.10)",
                  border: "1.5px solid #ececec",
                  transition: "0.3s",
                  minHeight: 420,
                  "&:hover": {
                    transform: "translateY(-10px) scale(1.03)",
                    boxShadow: `0 16px 40px ${gold}22`,
                    borderColor: gold,
                  },
                }}
              >
                {/* IMAGE */}
                <Box
                  component="img"
                  src={post.image}
                  alt={post.title}
                  sx={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                  }}
                />

                {/* CONTENT */}
                <Box sx={{ p: 3, display: "flex", flexDirection: "column", flex: 1 }}>
                  <Chip
                    label={post.type}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      mb: 1.5,
                      bgcolor: gold,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  />

                  <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>
                    {post.title}
                  </Typography>

                  <Typography sx={{ color: "#555", fontSize: 15, flex: 1 }}>
                    {post.desc}
                  </Typography>

                  <Button
                    sx={{
                      mt: 2,
                      alignSelf: "flex-start",
                      color: gold,
                      fontWeight: 700,
                      textTransform: "none",
                      border: `1px solid ${gold}`,
                      "&:hover": {
                        bgcolor: gold,
                        color: "#fff",
                      },
                    }}
                  >
                    Read Article →
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>

        {!loading && !error && filteredPosts.length > pageSize && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_, value) => setPage(value)}
              color="primary"
              siblingCount={isSmallScreen ? 0 : 1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.24)",
                },
                "& .Mui-selected": {
                  bgcolor: `${gold} !important`,
                  color: "#fff",
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
    <Footer/>
    </>
  );
};

export default BlogScreen;
