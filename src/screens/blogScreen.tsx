import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";
import Footer from "../components/Footer";

const gold = "#A67C1B";

/* ANIMATION */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

const posts = [
  {
    title: "The Voice of Africa",
    type: "Magazine",
    desc: "A deep collection of stories from real African experiences.",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
  },
  {
    title: "Rise of Young Leaders",
    type: "Book",
    desc: "Inspiring stories of young Africans shaping the future.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
  },
  {
    title: "Hidden Truths Vol. 1",
    type: "Magazine",
    desc: "Uncovered realities shaping modern African society.",
    image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6",
  },
  {
    title: "Rise of Young Leaders",
    type: "Book",
    desc: "Inspiring stories of young Africans shaping the future.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
  },
  {
    title: "Hidden Truths Vol. 1",
    type: "Magazine",
    desc: "Uncovered realities shaping modern African society.",
    image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6",
  },

];

const BlogScreen: React.FC = () => {
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
            Magazines & Books
          </Typography>

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

        {/* FLEX GRID REPLACEMENT */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {posts.map((post, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false }}
              variants={fadeUp}
              style={{
                flex: "1 1 320px",
                maxWidth: "380px",
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
      </Container>
    </Box>
    <Footer/>
    </>
  );
};

export default BlogScreen;