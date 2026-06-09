import React from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Facebook,
  LinkedIn,
  Email,
  WhatsApp,
  X,
  YouTube,
  Instagram,
  ArrowForwardRounded,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const gold = "#D6B15A";
const softGold = "#F5E2B8";

const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Contact", to: "/contact" },
];

const editorialLinks = [
  { label: "Blog", to: "/blog" },
  { label: "News", to: "/news" },
  { label: "Events", to: "/events" },
  { label: "KSA @ 80", to: "/king--Sunny-Ade-@80" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/share/1CUNo19Xzi/", icon: <Facebook /> },
  { label: "X", href: "https://x.com/realitylifemag?t=gUS7S5Z3qKFaC7YhmO8qAA&s=09", icon: <X /> },
  { label: "Instagram", href: "https://www.instagram.com/realitylifemag", icon: <Instagram /> },
  { label: "YouTube", href: "https://www.youtube.com/@Realitylifemagazine", icon: <YouTube /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/oghenemairo-adegeye-a5a34892", icon: <LinkedIn /> },
  { label: "WhatsApp", href: "https://wa.me/message/JW2BTKJVKKI6K1", icon: <WhatsApp /> },
];

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#02040A",
        color: "#fff",
        pt: { xs: 7, md: 10 },
        pb: { xs: 4, md: 5 },
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(214, 177, 90, 0.16), transparent 28%), radial-gradient(circle at 85% 20%, rgba(83, 111, 255, 0.12), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 42%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "stretch",
            p: { xs: 3, sm: 3.5, md: 4 },
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(12,18,34,0.96) 0%, rgba(5,8,16,0.94) 55%, rgba(214,177,90,0.14) 100%)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.32)",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: softGold,
                fontWeight: 900,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontSize: "0.78rem",
                mb: 1.4,
              }}
            >
              RealityLife Magazine
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: "1.7rem", sm: "2.1rem", md: "2.5rem" },
                lineHeight: 1.08,
                fontWeight: 900,
                maxWidth: 650,
                mb: 1.5,
              }}
            >
              Real stories, crafted with clarity, culture, and purpose.
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.8,
                maxWidth: 720,
                mb: 2.25,
              }}
            >
              We spotlight authentic voices, leadership journeys, cultural moments,
              and social impact stories that deserve to be seen, remembered, and shared.
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.75 }}>
              {[
                "Culture",
                "Leadership",
                "Interviews",
                "Events",
                "Legacy",
              ].map((item) => (
                <Chip
                  key={item}
                  label={item}
                  sx={{
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontWeight: 700,
                  }}
                />
              ))}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/blog"
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                sx={{
                  bgcolor: gold,
                  color: "#10131f",
                  borderRadius: 999,
                  px: 2.6,
                  py: 1.2,
                  fontWeight: 900,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#e3c06d",
                  },
                }}
              >
                Explore stories
              </Button>
              <Button
                component={RouterLink}
                to="/contact"
                variant="outlined"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.24)",
                  borderRadius: 999,
                  px: 2.6,
                  py: 1.2,
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: softGold,
                    bgcolor: "rgba(245,226,184,0.08)",
                  },
                }}
              >
                Contact editorial
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              alignContent: "start",
            }}
          >
            <Box
              sx={{
                p: { xs: 2.2, sm: 2.5 },
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: softGold, fontWeight: 900, mb: 1.25 }}>
                Quick access
              </Typography>
              <Stack spacing={1.1}>
                {primaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.to}
                    underline="none"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 0.5,
                      borderRadius: 1.5,
                      transition: "all 160ms ease",
                      "&:hover": {
                        color: softGold,
                        bgcolor: "rgba(255,255,255,0.04)",
                      },
                    }}
                  >
                    <span>{link.label}</span>
                    <ArrowForwardRounded sx={{ fontSize: 18 }} />
                  </Link>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                p: { xs: 2.2, sm: 2.5 },
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: softGold, fontWeight: 900, mb: 1.25 }}>
                Featured sections
              </Typography>
              <Stack spacing={1.1}>
                {editorialLinks.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.to}
                    underline="none"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 0.5,
                      borderRadius: 1.5,
                      transition: "all 160ms ease",
                      "&:hover": {
                        color: softGold,
                        bgcolor: "rgba(255,255,255,0.04)",
                      },
                    }}
                  >
                    <span>{link.label}</span>
                    <ArrowForwardRounded sx={{ fontSize: 18 }} />
                  </Link>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 3.5, md: 4.5 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.9fr 0.75fr" },
            gap: { xs: 3, md: 3.5 },
          }}
        >
          <Box>
            <Typography sx={{ color: softGold, fontWeight: 900, mb: 1.5 }}>
              Connect with us
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, mb: 2 }}>
              Email us for submissions, partnerships, interviews, or media coverage.
              We respond with the care and professionalism every story deserves.
            </Typography>

            <Stack spacing={1} sx={{ mb: 2.5 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>
                Email: realitylifemagazine@gmail.com
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>
                Phone: +234 706 612 2290
              </Typography>
            </Stack>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.1 }}>
              <Button
                component="a"
                href="mailto:realitylifemagazine@gmail.com"
                startIcon={<Email />}
                variant="outlined"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                  "&:hover": {
                    borderColor: softGold,
                    bgcolor: "rgba(245,226,184,0.08)",
                  },
                }}
              >
                Email us
              </Button>
              <Button
                component="a"
                href="https://wa.me/message/JW2BTKJVKKI6K1"
                target="_blank"
                rel="noreferrer"
                startIcon={<WhatsApp />}
                variant="contained"
                sx={{
                  bgcolor: "#1FAF38",
                  color: "#fff",
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  "&:hover": {
                    bgcolor: "#17882c",
                  },
                }}
              >
                WhatsApp
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: softGold, fontWeight: 900, mb: 1.5 }}>
              Follow our journey
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, mb: 2 }}>
              Stay close to our latest interviews, launches, event coverage, and
              behind-the-scenes moments.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {socialLinks.map((item) => (
                <IconButton
                  key={item.label}
                  component="a"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  sx={{
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.1)",
                    bgcolor: "rgba(255,255,255,0.04)",
                    transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
                    "&:hover": {
                      bgcolor: "rgba(245,226,184,0.12)",
                      borderColor: "rgba(245,226,184,0.32)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {item.icon}
                </IconButton>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: softGold, fontWeight: 900, mb: 1.5 }}>
              Editorial promise
            </Typography>
            <Stack spacing={1.2}>
              {[
                "Authentic reporting",
                "Thoughtful storytelling",
                "Leadership and culture",
                "Memorable visual coverage",
              ].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "rgba(255,255,255,0.78)",
                    fontWeight: 700,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: softGold,
                      boxShadow: "0 0 0 4px rgba(245,226,184,0.08)",
                    }}
                  />
                  <Typography sx={{ fontWeight: 700 }}>{item}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 4, md: 5 }, borderColor: "rgba(255,255,255,0.08)" }} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.54)", lineHeight: 1.7 }}>
            © {new Date().getFullYear()} <span style={{ color: softGold }}>RealityLife Magazine</span>. All rights reserved.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.46)", lineHeight: 1.7 }}>
            Crafted to keep your stories visible, memorable, and easy to navigate.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
