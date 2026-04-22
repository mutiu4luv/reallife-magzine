import React from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
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
import Footer from "../components/Footer";

const gold = "#A67C1B";

const ContactUsScreen: React.FC = () => {
  return (
    <>
    <Box sx={{ bgcolor: "white", minHeight: "100vh", color: "#fff", py: 8 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            textAlign: "center",
            mb: 2,
            color: gold,
          }}
        >
          Contact Us
        </Typography>

        <Typography
          sx={{
            textAlign: "center",
            color: "black",
            mb: 6,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          We’d love to hear from you. Reach out for stories, collaborations,
          inquiries, or feedback.
        </Typography>

        {/* Contact Card */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            bgcolor: "#111",
            borderTop: `4px solid ${gold}`,
          }}
        >
          {/* Contact Info */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: gold, fontWeight: 700, mb: 2 }}>
              Get in Touch
            </Typography>

            <Typography sx={{ color: "#ccc", mb: 1 }}>
              Email: realitylifemagazine@gmail.com
            </Typography>

            <Typography sx={{ color: "#ccc" }}>
              Phone: +234 706 612 2290
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "#222", mb: 4 }} />

          {/* Contact Form */}
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              sx={{
                input: { color: "#fff" },
                label: { color: "#bbb" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#333" },
                  "&:hover fieldset": { borderColor: gold },
                  "&.Mui-focused fieldset": { borderColor: gold },
                },
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              sx={{
                input: { color: "#fff" },
                label: { color: "#bbb" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#333" },
                  "&:hover fieldset": { borderColor: gold },
                  "&.Mui-focused fieldset": { borderColor: gold },
                },
              }}
            />

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={5}
              variant="outlined"
              sx={{
                textarea: { color: "#fff" },
                label: { color: "#bbb" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#333" },
                  "&:hover fieldset": { borderColor: gold },
                  "&.Mui-focused fieldset": { borderColor: gold },
                },
              }}
            />

            <Button
              variant="contained"
              sx={{
                mt: 2,
                bgcolor: gold,
                fontWeight: 700,
                py: 1.2,
                "&:hover": {
                  bgcolor: "#8f6a14",
                },
              }}
            >
              Send Message
            </Button>
          </Box>

          <Divider sx={{ borderColor: "#222", my: 4 }} />

          {/* Social Links */}
          <Typography sx={{ color: gold, fontWeight: 700, mb: 2 }}>
            Follow Us
          </Typography>

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
        </Paper>
      </Container>

      {/* FLOATING WHATSAPP BUTTON */}
      <Box
        component="a"
        href="https://wa.me/message/JW2BTKJVKKI6K1"
        target="_blank"
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          zIndex: 999,
          "&:hover": {
            transform: "scale(1.1)",
            transition: "0.2s",
          },
        }}
      >
        <WhatsApp sx={{ color: "#fff", fontSize: 32 }} />
      </Box>
    </Box>
    <Footer />
  </>
  );
};

export default ContactUsScreen;