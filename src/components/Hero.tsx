import React from "react";
import { Box, Typography, Button, Container, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/mainhero.jpeg";
import { Typewriter } from "react-simple-typewriter";

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        color: "#fff",
        backgroundColor: "#0a1929", // fallback color for empty spaces
        backgroundImage: `
          linear-gradient(rgba(10, 25, 41, 0.85), rgba(10, 25, 41, 0.85)),
          url(${heroImage})
        `,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: {
          xs: "contain", // ✅ show full image on mobile
          md: "cover",   // ✅ fill screen nicely on larger screens
        },
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ maxWidth: "800px" }}>
        <Typography
  variant="h2"
  sx={{
    fontWeight: 800,
    fontSize: { xs: "2.3rem", md: "3.8rem" },
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  }}
>
  <Typewriter
    words={["Telling Africa’s Stories. Reaching the World."]}
    loop={1}             
    cursor={false}       
    typeSpeed={35}
    deleteSpeed={0}
    delaySpeed={1000}
  />
</Typography>

          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.8,
              fontWeight: 400,
              fontSize: { xs: "1rem", md: "1.15rem" },
            }}
          >
            RealityLife Magazine  Amplifying voices, shaping narratives, and
            documenting today for tomorrow’s legacy.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/contact")}
              sx={{
                backgroundColor: "#4F46E5",
                borderRadius: "50px",
                px: 5,
                py: 1.6,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "0 10px 25px rgba(79,70,229,0.4)",
                "&:hover": {
                  backgroundColor: "#4338CA",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Get Started
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/about")}
              sx={{
                borderColor: "#fff",
                color: "#fff",
                borderRadius: "50px",
                px: 5,
                py: 1.6,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;