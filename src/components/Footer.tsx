import React from "react";
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Facebook,
  LinkedIn,
  Email,
  WhatsApp,
  X,
  YouTube,
  Instagram,
} from "@mui/icons-material";

const gold = "#A67C1B";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#000",
        color: "#fff",
        pt: { xs: 8, md: 10 },
        pb: 4,
        // mt: 10,
      }}
    >
      <Container maxWidth="lg">
        {/* Top Section */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.2fr 0.8fr", md: "1.4fr 0.7fr 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "start",
          }}
        >
          {/* Brand */}
          <Box sx={{ maxWidth: { xs: "none", md: 380 }, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: gold,
                mb: 2,
              }}
            >
              RealityLife Magazine
            </Typography>
            <Typography sx={{ color: "#bbb", lineHeight: 1.8 }}>
              Telling real stories that inspire, educate, and connect cultures.
              We spotlight authentic voices, leadership journeys, and impactful
              human experiences.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: gold, fontWeight: 600, mb: 2 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {["Home", "About", "Gallery", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  underline="none"
                  color="inherit"
                  sx={{
                    color: "#bbb",
                    "&:hover": { color: gold },
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Contact */}
          <Box sx={{ minWidth: 0, gridColumn: { xs: "auto", sm: "1 / -1", md: "auto" } }}>
            <Typography sx={{ color: gold, fontWeight: 600, mb: 2 }}>
              Contact
            </Typography>
            <Typography sx={{ color: "#bbb", overflowWrap: "anywhere" }}>
              Email: realitylifemagazine@gmail.com
            </Typography>
            <Typography sx={{ color: "#bbb", mb: 2 }}>
              Phone: +234 706 612 2290
            </Typography>

            {/* Social Icons */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <IconButton
                component="a"
                href="https://www.facebook.com/share/1CUNo19Xzi/"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <Facebook />
              </IconButton>

              <IconButton
                component="a"
                href="https://x.com/realitylifemag?t=gUS7S5Z3qKFaC7YhmO8qAA&s=09"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <X />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.instagram.com/realitylifemag"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <Instagram />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.youtube.com/@Realitylifemagazine"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <YouTube />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.linkedin.com/in/oghenemairo-adegeye-a5a34892"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <LinkedIn />
              </IconButton>

              <IconButton
                component="a"
                href="https://wa.me/message/JW2BTKJVKKI6K1"
                target="_blank"
                sx={{ color: "#fff" }}
              >
                <WhatsApp />
              </IconButton>

              <IconButton
                component="a"
                href="mailto:realitylifemagazine@gmail.com"
                sx={{ color: "#fff" }}
              >
                <Email />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 6, borderColor: "#222" }} />

        {/* Bottom */}
        <Typography sx={{ textAlign: "center", color: "#777" }}>
          © {new Date().getFullYear()}{" "}
          <span style={{ color: gold }}>RealityLife Magazine</span>. All rights
          reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
