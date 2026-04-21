import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import g1 from "../assets/gallery1.jpeg";
import g2 from "../assets/gallery2.jpeg";
import g3 from "../assets/gallery3.jpeg";
import g4 from "../assets/gallery4.jpeg";
import g5 from "../assets/gallery5.jpeg";

const images = [g1, g2, g3, g4, g5];
const gold = "#A67C1B";

const PhotoGallery: React.FC = () => {
  const [current, setCurrent] = useState(0);

  // Responsive items to show: 3 on desktop, 2 on tablet, 1 on mobile
  const [itemsToShow, setItemsToShow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) setItemsToShow(1);
      else if (window.innerWidth < 960) setItemsToShow(2);
      else setItemsToShow(3);
    };
    
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = images.length - itemsToShow;

  const next = () => {
    setCurrent((p) => (p >= maxIndex ? 0 : p + 1));
  };

  const prev = () => {
    setCurrent((p) => (p <= 0 ? maxIndex : p - 1));
  };

  // Auto slide
  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [itemsToShow, maxIndex]);

  return (
    <Box sx={{ bgcolor: "#fff", py: 10, px: { xs: 2, md: 8 } }}>
      {/* Heading */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h4"
          sx={{
            color: gold,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: { xs: "1.8rem", md: "2.4rem" },
          }}
        >
          Photo Gallery
        </Typography>

        <Box sx={{ width: 80, height: 4, bgcolor: gold, mx: "auto", mt: 1, borderRadius: 2 }} />

        <Typography sx={{ mt: 3, maxWidth: 700, mx: "auto", color: "#555" }}>
          Explore moments captured in our magazine journey.
        </Typography>
      </Box>

      {/* Carousel Container */}
      <Box sx={{ position: "relative", width: "100%", maxWidth: "1200px", mx: "auto" }}>
        <Box
          sx={{
            width: "100%",
            height: { xs: 220, md: 280 }, // Slightly taller for desktop
            overflow: "hidden",
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              // Moves based on the percentage of one item's width
              transform: `translateX(-${current * (100 / itemsToShow)}%)`,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {images.map((img, i) => (
              <Box
                key={i}
                sx={{
                  // Calculate width based on how many items we want to show
                  minWidth: `${100 / itemsToShow}%`,
                  height: "100%",
                  px: 1, // Adds gap between images
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
                    borderRadius: 3,
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
            left: { xs: -5, md: -20 },
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
            right: { xs: -5, md: -20 },
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
    </Box>
  );
};

export default PhotoGallery;