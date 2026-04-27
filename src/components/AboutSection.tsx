import React from "react";
import { Box, Typography, Paper, Container } from "@mui/material";
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
        px: { xs: 2, sm: 3 },
        minHeight: "auto",
        backgroundColor: "#000",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <Container maxWidth="lg" disableGutters>
      {/* Heading */}
      <Box sx={{ position: "relative", display: "inline-block", mb: { xs: 4, md: 6 }, maxWidth: "100%" }}>
        <Typography
          sx={{
            fontSize: { xs: "1.7rem", sm: "2rem", md: "2.5rem" },
            lineHeight: 1.15,
            fontWeight: "bold",
            mb: { xs: 2.5, md: 4 },
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
          textAlign: { xs: "left", md: "center" },
          mb: { xs: 4, md: 6 },
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
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
            gap: { xs: 2.5, md: 4 },
        }}
      >
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            style={{
              width: "100%",
              display: "flex",
            }}
          >
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 2,
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
                  overflowWrap: "anywhere",
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

              <Typography sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
                {section.description}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
      </Container>
    </Box>
  );
};

export default AboutSection;
