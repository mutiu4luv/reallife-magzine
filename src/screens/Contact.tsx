import React, { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Divider,
  Snackbar,
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
import { API_BASE_URL } from "../config/api";

const gold = "#A67C1B";
const CONTACT_ENDPOINTS = [
  `${API_BASE_URL}/api/contact`,
  `${API_BASE_URL}/api/contact-messages`,
  `${API_BASE_URL}/api/contactMessages`,
];

type Feedback = {
  severity: "success" | "error";
  message: string;
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
};

const sendContactMessage = async (payload: { fullName: string; email: string; message: string }) => {
  let lastError = "Unable to send message.";

  for (const endpoint of CONTACT_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 404 && endpoint !== CONTACT_ENDPOINTS[CONTACT_ENDPOINTS.length - 1]) {
        lastError = await getErrorMessage(response, lastError);
        continue;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, lastError));
      }

      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (endpoint === CONTACT_ENDPOINTS[CONTACT_ENDPOINTS.length - 1]) {
        throw new Error(lastError);
      }
    }
  }
};

const ContactUsScreen: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.fullName || !payload.email || !payload.message) {
      setFeedback({ severity: "error", message: "Full name, email, and message are required." });
      return;
    }

    setIsSending(true);
    try {
      await sendContactMessage(payload);
      form.reset();
      setFeedback({ severity: "success", message: "Message sent successfully." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to send message.",
      });
    } finally {
      setIsSending(false);
    }
  };

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
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              variant="outlined"
              required
              disabled={isSending}
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
              name="email"
              type="email"
              variant="outlined"
              required
              disabled={isSending}
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
              name="message"
              multiline
              rows={5}
              variant="outlined"
              required
              disabled={isSending}
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
              type="submit"
              variant="contained"
              disabled={isSending}
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
              {isSending ? "Sending..." : "Send Message"}
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
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={3600}
      onClose={() => setFeedback(null)}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        severity={feedback?.severity || "success"}
        onClose={() => setFeedback(null)}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {feedback?.message}
      </Alert>
    </Snackbar>
    <Footer />
  </>
  );
};

export default ContactUsScreen;
