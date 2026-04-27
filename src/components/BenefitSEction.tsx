import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InsightsIcon from "@mui/icons-material/Insights";
import ComputerIcon from "@mui/icons-material/Computer";

const gold = "#A67C1B";

const benefits = [
  {
    title: "Powerful Storytelling",
    description:
      "We publish compelling stories that reflect real-life experiences, culture, leadership, and human impact across Africa and beyond.",
    icon: <TrendingUpIcon fontSize="large" sx={{ color: gold }} />,
  },
  {
    title: "Insightful Journalism",
    description:
      "We deliver deep insights, investigative reports, and thought-provoking commentary that inform and inspire readers globally.",
    icon: <InsightsIcon fontSize="large" sx={{ color: gold }} />,
  },
  {
    title: "Digital Media Excellence",
    description:
      "We leverage modern digital platforms to amplify voices, connect audiences, and shape global conversations.",
    icon: <ComputerIcon fontSize="large" sx={{ color: gold }} />,
  },
];

const BenefitSection: React.FC = () => {
  return (
    <Box
      id="benefits"
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, sm: 3 },
        textAlign: "center",
        backgroundColor: "#ffffff",
        color: "#111",
      }}
    >
      <Container maxWidth="lg" disableGutters>
      {/* Heading */}
      <Box sx={{ position: "relative", display: "inline-block", mb: { xs: 4, md: 6 }, maxWidth: "100%" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.65rem", sm: "2rem", md: "2.5rem" },
            lineHeight: 1.15,
            color: gold,
            textTransform: "uppercase",
          }}
        >
          Why Read RealityLife Magazine
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

      {/* Subtitle */}
      <Typography
        sx={{
          maxWidth: 750,
          mx: "auto",
          mb: { xs: 4, md: 6 },
          fontSize: { xs: "1rem", md: "1.1rem" },
          color: "rgba(0,0,0,0.7)",
        }}
      >
        RealityLife Magazine is a voice for truth, culture, and impact 
        delivering stories that inform, inspire, and connect readers globally.
      </Typography>

      <Box
  sx={{
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
    gap: { xs: 2.5, md: 4 },
  }}
>
  {benefits.map((item, index) => (
    <Box
      key={index}
      sx={{
        display: "flex",
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          x: index === 0 ? -80 : index === 2 ? 80 : 0,
          y: index === 1 ? 80 : 0,
        }}
        whileInView={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        viewport={{
          once: false,
          amount: 0.3,
        }}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            height: "100%",
            maxWidth: { xs: 420, md: "none" },
            width: "100%",
            p: 3,
            borderRadius: 2,
            backgroundColor: "#000",
            color: "#fff",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            transition: "0.3s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            "&:hover": {
              transform: "translateY(-10px) scale(1.03)",
              boxShadow: `0 10px 25px rgba(166,124,27,0.25)`,
            },
          }}
        >
          <CardContent>
            <Box sx={{ mb: 2 }}>{item.icon}</Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#A67C1B",
              }}
            >
              {item.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#fff",
                fontSize: { xs: "0.9rem", md: "1rem" },
                textAlign: "left",
                lineHeight: 1.7,
              }}
            >
              {item.description}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  ))}
</Box>
      </Container>
    </Box>
  );
};

export default BenefitSection;
