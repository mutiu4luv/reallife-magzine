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
        minHeight: { xs: "calc(100svh - 72px)", md: "calc(100svh - 96px)" },
        display: "flex",
        alignItems: "center",
        color: "#fff",
        backgroundColor: "#0a1929",
        backgroundImage: `
          linear-gradient(rgba(10, 25, 41, 0.85), rgba(10, 25, 41, 0.85)),
          url(${heroImage})
        `,
        backgroundRepeat: "no-repeat",
        backgroundPosition: { xs: "center top", md: "center" },
        backgroundSize: "cover",
        px: { xs: 0, sm: 2 },
        py: { xs: 8, sm: 10, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 3, md: 4 }} sx={{ maxWidth: { xs: 560, md: 800 } }}>
        <Typography
  variant="h2"
  sx={{
    fontWeight: 800,
    fontSize: { xs: "2.1rem", sm: "2.8rem", md: "3.8rem" },
    lineHeight: { xs: 1.12, md: 1.2 },
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
              fontSize: { xs: "1rem", sm: "1.08rem", md: "1.15rem" },
              maxWidth: 680,
            }}
          >
            RealityLife Magazine  Amplifying voices, shaping narratives, and
            documenting today for tomorrow’s legacy.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/blog")}
              sx={{
                backgroundColor: "#4F46E5",
                borderRadius: "50px",
                px: { xs: 3, sm: 5 },
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
                px: { xs: 3, sm: 5 },
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
