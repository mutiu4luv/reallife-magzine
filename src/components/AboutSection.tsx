import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

const gold = "#A67C1B";

type Section = {
  title: string;
  description: string;
};

const AboutSection: React.FC = () => {
  const sections: Section[] = [
    {
      title: "Our Mission",
      description:
        "To tell real, impactful stories that inspire, educate, and connect people across cultures. RealityLife Magazine is committed to showcasing authentic voices and meaningful experiences that shape society.",
    },
    {
      title: "Our Vision",
      description:
        "To become a leading global storytelling platform where real-life experiences, culture, leadership, and inspiration are shared to influence positive change.",
    },
    {
      title: "Our Values",
      description:
        "Authenticity, creativity, integrity, and impact guide everything we publish. We believe in truth-driven storytelling that empowers and uplifts communities.",
    },
  ];

  return (
    <Box
    sx={{
        py: { xs: 10, md: 12 },   // increased top/bottom space
        px: { xs: 2, md: 8 },
        minHeight: "auto",
        backgroundColor: "#000",
        color: "#fff",
        textAlign: "center",
      }}
    >
      {/* Heading */}
      <Box sx={{ position: "relative", display: "inline-block", mb: 6 }}>
        <Typography
          sx={{
            fontSize: { xs: "1.8rem", md: "2.5rem" },
            fontWeight: "bold",
            mb: 4,
            color: gold,
          }}
        >
          About Us
        </Typography>

        <motion.div
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            height: 3,
            width: "60%",
            borderRadius: 2,
            backgroundColor: gold,
            boxShadow: `0 0 10px ${gold}, 0 0 20px ${gold}`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 1, 0] }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </Box>

      {/* Intro */}
      <Typography
        sx={{
          textAlign: "justify",
          mb: 6,
          maxWidth: 800,
          mx: "auto",
          fontSize: { xs: "1rem", md: "1.2rem" },
          color: "rgba(255,255,255,0.8)",
        }}
      >
        RealityLife Magazine is a storytelling platform dedicated to sharing
        real experiences, culture, leadership journeys, and inspirational
        narratives. We highlight voices that matter and bring authentic human
        stories to life through powerful editorial content.
      </Typography>

      {/* CARDS (FLEXBOX - FIXED HEIGHT & WIDTH) */}
      <Box
        sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 10, md: 4 },
        }}
      >
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            style={{
              width: "320px",
              display: "flex",
              marginBottom: "16px",
            }}
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: "#111",
                color: "#fff",
                textAlign: "left",
                height: "100%", 
                width: "100%",  
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: `0 10px 25px rgba(166,124,27,0.25)`,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  mb: 2,
                  color: gold,
                }}
              >
                {section.title}
              </Typography>

              <motion.div
                style={{
                  height: 2.5,
                  width: "60%",
                  borderRadius: 2,
                  backgroundColor: gold,
                  boxShadow: `0 0 8px ${gold}`,
                  marginBottom: 12,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

              <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
                {section.description}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default AboutSection;