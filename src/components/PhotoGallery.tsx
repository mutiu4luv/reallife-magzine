import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, IconButton, Container } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { motion } from "framer-motion"; // ✅ Import motion

import g1 from "../assets/gallery1.jpeg";
import g2 from "../assets/gallery2.jpeg";
import g3 from "../assets/gallery3.jpeg";
import g4 from "../assets/gallery4.jpeg";
import g5 from "../assets/gallery5.jpeg";

const images = [g1, g2, g3, g4, g5];
const gold = "#A67C1B";

const PhotoGallery: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const nextItemsToShow = window.innerWidth < 600 ? 1 : window.innerWidth < 960 ? 2 : 3;
      setItemsToShow(nextItemsToShow);
      setCurrent((value) => Math.min(value, Math.max(images.length - nextItemsToShow, 0)));
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(images.length - itemsToShow, 0);

  const next = useCallback(() => {
    setCurrent((p) => (p >= maxIndex ? 0 : p + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((p) => (p <= 0 ? maxIndex : p - 1));
  }, [maxIndex]);

  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <Box sx={{ bgcolor: "#fff", py: { xs: 7, md: 10 }, px: { xs: 2, sm: 3 } }}>
      <Container maxWidth="lg" disableGutters>
      {/* Heading Section */}
      <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
        <Typography
          variant="h4"
          sx={{
            color: gold,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: { xs: "1.65rem", sm: "2rem", md: "2.4rem" },
            lineHeight: 1.15,
          }}
        >
          Photo Gallery
        </Typography>

        {/* ✅ CONTINUOUS DRAWING LINE */}
        <Box
          sx={{
            width: 120,
            height: 4,
            bgcolor: "rgba(166,124,27,0.1)", // Background track
            mx: "auto",
            mt: 1,
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2, // Speed of the draw
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "loop",
            }}
            style={{
              height: "100%",
              background: gold,
              borderRadius: "2px",
            }}
          />
        </Box>

        <Typography sx={{ mt: 3, maxWidth: 700, mx: "auto", color: "#555" }}>
          Explore moments captured in our magazine journey.
        </Typography>
      </Box>

      {/* Carousel Container */}
      <Box sx={{ position: "relative", width: "100%", maxWidth: "1200px", mx: "auto" }}>
        <Box
          sx={{
            width: "100%",
            height: { xs: 230, sm: 260, md: 300 },
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              transform: `translateX(-${current * (100 / itemsToShow)}%)`,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {images.map((img, i) => (
              <Box
                key={i}
                sx={{
                  minWidth: `${100 / itemsToShow}%`,
                  height: "100%",
                  px: 1,
                  boxSizing: "border-box",
                }}
              >
                <Box
                  component="img"
                  src={img}
                  alt={`gallery-${i}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 2,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <IconButton
          onClick={prev}
          sx={{
            position: "absolute",
            top: "50%",
            left: { xs: 8, md: -18 },
            transform: "translateY(-50%)",
            bgcolor: "#fff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 2,
            "&:hover": { bgcolor: gold, color: "#fff" },
          }}
        >
          <KeyboardArrowLeftIcon />
        </IconButton>

        <IconButton
          onClick={next}
          sx={{
            position: "absolute",
            top: "50%",
            right: { xs: 8, md: -18 },
            transform: "translateY(-50%)",
            bgcolor: "#fff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 2,
            "&:hover": { bgcolor: gold, color: "#fff" },
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
      </Box>
      </Container>
    </Box>
  );
};

export default PhotoGallery;
