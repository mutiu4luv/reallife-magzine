import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarIcon from "@mui/icons-material/Star";
import PublicIcon from "@mui/icons-material/Public";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CampaignIcon from "@mui/icons-material/Campaign";
import Footer from "../components/Footer";

const accent = "#A67C1B";

const editorialFocus: string[] = [
  "Authentic journalism that captures real human experiences.",
  "In-depth features in culture, fashion, lifestyle, and society.",
  "Engaging storytelling that inspires and informs.",
  "Exclusive interviews with trailblazers and thought leaders.",
  "Timely perspectives on sports, wellness, and innovations.",
];

const values = [
  { title: "Integrity", desc: "We publish with honesty and truth." },
  { title: "Creativity", desc: "We embrace bold storytelling." },
  { title: "Inspiration", desc: "We uplift and empower readers." },
  { title: "Diversity", desc: "We celebrate every voice and culture." },
  { title: "Relevance", desc: "We reflect the world as it evolves." },
];

const featuredArticles = [
  "Exploring Africa’s Emerging Fashion Voices",
  "Grassroots Football and Community Impact",
  "Stories of Resilience from Everyday Nigerians",
];

const AboutUsScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          px: { xs: 2, md: 6 },
          py: 8,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #0A192F, #1c2431)"
              : "linear-gradient(135deg, #f5f7fa, #e3e6ed)",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 900,
            mx: "auto",
            p: { xs: 3, md: 6 },
            borderRadius: 4,
          }}
        >
          {/* Heading */}
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ color: accent, fontWeight: 800 }}
          >
            About RealityLife Magazine
          </Typography>

          {/* Intro */}
          <Typography sx={{ mb: 3, lineHeight: 1.8 }}>
            RealityLife Magazine is dedicated to telling real stories that matter.
            We spotlight culture, lifestyle, people, and communities through
            compelling journalism and thoughtful storytelling that connects Africa
            to the world.
          </Typography>

          {/* Mission visuals */}
          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h5"
            component="h2"
            sx={{ color: accent, mb: 2, fontWeight: 700 }}
          >
            Our Mission in Action
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <PublicIcon sx={{ color: accent }} />
              <Typography>Giving global visibility to African stories.</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <AutoStoriesIcon sx={{ color: accent }} />
              <Typography>Documenting experiences that shape society.</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <CampaignIcon sx={{ color: accent }} />
              <Typography>Using media to inspire dialogue and change.</Typography>
            </Box>
          </Box>

          {/* Editorial Focus */}
          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h5"
            component="h2"
            sx={{ color: accent, fontWeight: 700 }}
          >
            What We Cover
          </Typography>

          <List>
            {editorialFocus.map((item, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon sx={{ color: accent }} />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>

          {/* Values */}
          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h5"
            component="h2"
            sx={{ color: accent, fontWeight: 700 }}
          >
            Our Core Values
          </Typography>

          <Box sx={{ mt: 2 }}>
            {values.map((val, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  p: 2,
                  borderLeft: `4px solid ${accent}`,
                  background:
                    theme.palette.mode === "dark" ? "#1f2633" : "#f9fafb",
                  borderRadius: 2,
                }}
              >
                <StarIcon sx={{ color: accent }} />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {val.title}
                  </Typography>
                  <Typography variant="body2">{val.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Featured previews */}
          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h5"
            component="h2"
            sx={{ color: accent, fontWeight: 700 }}
          >
            Featured Stories
          </Typography>

          <List>
            {featuredArticles.map((title, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon sx={{ color: accent }} />
                </ListItemIcon>
                <ListItemText primary={title} />
              </ListItem>
            ))}
          </List>

          {/* Closing */}
          <Divider sx={{ my: 4 }} />

          <Typography sx={{ lineHeight: 1.8 }}>
            RealityLife Magazine exists to preserve truth, celebrate culture, and
            amplify voices. Every story we publish reflects depth, integrity, and
            the richness of human experience.
          </Typography>
        </Paper>
      </Box>

      <Footer />
    </>
  );
};

export default AboutUsScreen;