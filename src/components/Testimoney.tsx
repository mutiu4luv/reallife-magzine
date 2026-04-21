import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";

const gold = "#A67C1B";

type Testimony = {
  name: string;
  image: string;
  message: string;
};

const testimonies: Testimony[] = [
  {
    name: "Bonny Christian",
    image: "/assets/hero.jpeg",
    message:
      "RealityLife Magazine tells stories that truly matter. Every edition leaves me inspired. The depth of storytelling and authenticity is rare and powerful.",
  },
  {
    name: "Ifeanyi Stanley",
    image: "/hero.jpeg",
    message:
      "A powerful voice for culture and leadership. I always look forward to new releases because of the consistency and quality.",
  },
  {
    name: "Grace Obi",
    image: "/assets/hero.jpeg",
    message:
      "This platform bridges knowledge, inspiration, and authentic storytelling beautifully. It has changed how I consume meaningful content online.",
  },
];

const shuffleArray = (array: Testimony[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const truncate = (text: string, limit = 110) =>
  text.length > limit ? text.slice(0, limit) + "..." : text;

const TestimonyCard: React.FC<{
  item: Testimony;
  index: number;
}> = ({ item, index }) => {
  // Local state ensures the button only functions for this specific card
  const [expanded, setExpanded] = useState(false);

  const directions = [
    { x: -80, y: 0 }, 
    { x: 80, y: 0 },  
    { x: 0, y: 80 },  
  ];

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[index % 3] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: "easeOut",
        delay: index * 0.1 
      }}
      viewport={{ once: false, amount: 0.3 }}
      style={{ width: "100%", maxWidth: "320px" }}
    >
      <Card
        sx={{
          p: 2.5,
          borderRadius: 4,
          bgcolor: "#111",
          color: "#fff",
          height: "100%",
          position: "relative",
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-10px)",
            boxShadow: `0 12px 25px rgba(166,124,27,0.25)`,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "3px",
            background: gold,
          },
        }}
      >
        <CardContent sx={{ p: 1, textAlign: "left", flexGrow: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar
              src={item.image}
              alt={item.name}
              sx={{
                width: 70,
                height: 70,
                mx: "auto",
                mb: 2,
                border: `2px solid ${gold}`,
              }}
            />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: gold }}
            >
              {item.name}
            </Typography>

            {/* Moving Gold Line Container */}
            <Box 
              sx={{ 
                width: "60px", 
                height: "2px", 
                bgcolor: "rgba(166,124,27,0.2)", 
                mx: "auto", 
                mt: 1, 
                overflow: "hidden",
                position: "relative"
              }}
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  background: gold,
                  position: "absolute"
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              fontStyle: "italic",
              textAlign: "left",
              minHeight: 72,
              borderBottom: `1px solid rgba(166,124,27,0.3)`,
              pb: 1
            }}
          >
            "{expanded ? item.message : truncate(item.message)}"
          </Typography>

          {item.message.length > 110 && (
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                mt: 2,
                color: gold,
                textTransform: "none",
                fontWeight: 600,
                p: 0,
                minWidth: 0,
                "&:hover": { 
                    background: "transparent", 
                    textDecoration: "underline" 
                }
              }}
            >
              {expanded ? "Read less" : "Read more"}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const TestimonySection: React.FC = () => {
  const randomThree = useMemo(
    () => shuffleArray(testimonies).slice(0, 3),
    []
  );

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        px: { xs: 3, md: 10 },
        textAlign: "center",
        bgcolor: "#000",
        overflow: "hidden", 
      }}
    >
      <Box sx={{ display: 'inline-block', mb: 8 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: gold,
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: { xs: "1.6rem", md: "2.2rem" },
            mb: 1
          }}
        >
          What Our Readers Say
        </Typography>
        {/* Animated Headline Underline */}
        <Box sx={{ width: "100%", height: "4px", bgcolor: "rgba(166,124,27,0.2)", borderRadius: "2px", overflow: 'hidden', position: 'relative' }}>
            <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: '40%', height: '100%', background: gold, position: 'absolute' }}
            />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: { xs: 6, md: 8 }, 
          columnGap: { xs: 2, md: 10 },
        }}
      >
        {randomThree.map((item, index) => (
          <Box
            key={index}
            sx={{
              flex: { xs: "100%", sm: "45%", md: "25%" },
              display: "flex",
              justifyContent: "center",
            }}
          >
            <TestimonyCard item={item} index={index} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TestimonySection;