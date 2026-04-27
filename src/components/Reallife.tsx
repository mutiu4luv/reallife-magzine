import React from "react";
import { Box, Typography } from "@mui/material";
import { Typewriter } from "react-simple-typewriter";

const Reallife: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: "auto", md: "72vh" },
        position: "relative",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        py: { xs: 8, sm: 10, md: 12 },
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Subtle glow effect */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at center, rgba(0,255,120,0.08), transparent 60%)",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          textAlign: "left",
          zIndex: 2,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#fff",
            fontSize: { xs: "1.85rem", sm: "2.4rem", md: "3rem" },
            lineHeight: 1.15,
            mb: 2,
          }}
        >
          <Typewriter
            words={["RealityLife Magazine"]}
            loop={1}
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            color: "#cfcfcf",
            fontSize: { xs: "1rem", md: "1.16rem" },
            lineHeight: { xs: 1.7, md: 1.8 },
            fontWeight: 300,
            textAlign: { xs: "left", md: "justify" },
          }}
        >
          RealityLife Magazine is more than a publication it is a voice, a
          vision, and a vibrant platform shaping narratives that matter. Rooted
          in truth, excellence, and impact, we tell compelling stories across
          culture, leadership, lifestyle, and social development, connecting
          people, ideas, and opportunities. For over a decade, our journey has
          been one of resilience, growth, and unwavering commitment to impactful
          storytelling. RealityLife Magazine doesn't just report life it defines
          it.
        </Typography>
      </Box>
    </Box>
  );
};

export default Reallife;
