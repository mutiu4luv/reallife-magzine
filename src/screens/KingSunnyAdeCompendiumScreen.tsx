import React, { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import kingImage from "../assets/king.jpeg";
import authorizeImage from "../assets/authorize.jpeg";
import authorized2Image from "../assets/authorized2.jpeg";
import Footer from "../components/Footer";
import { submitCompendiumMessage, type CompendiumMessageKind } from "../services/contentApi";

const gold = "#B58B2A";
const deepNavy = "#0B1220";
const ivory = "#F8F2E8";
const paperBg = "#0F172A";
const emailAddress = "realitylifemag@gmail.com";

const interviewPrompts = [
  "What King Sunny Ade means to you",
  "How his music has inspired you",
  "Your favourite memories or songs",
  "Why his legacy matters to you",
  "A perfect description of KSA",
];

const messageKindLabel: Record<CompendiumMessageKind, string> = {
  interview: "Interview",
  tribute: "Tribute",
  goodwill: "Goodwill Message",
  congratulatory: "Congratulatory Message",
};

const buildMailtoHref = (subject: string, body: string) =>
  `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const authorizationHighlights = [
  "Official mandate to compile, produce, print, publish, market, and distribute the commemorative compendium.",
  "Authority to gather interviews, photographs, tributes, adverts, sponsorships, articles, and historical materials.",
  "Launch, sales, and revenue management aligned with the agreed framework.",
];

const KingSunnyAdeCompendiumScreen: React.FC = () => {
  const [kind, setKind] = useState<CompendiumMessageKind>("congratulatory");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const mailtoSubject = useMemo(
    () => `King Sunny Ade @ 80 - ${messageKindLabel[kind]}`,
    [kind]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const organization = String(formData.get("organization") || "").trim();
    const advertRate = String(formData.get("advertRate") || "").trim();
    const headline = String(formData.get("headline") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!fullName || !email || !phone) {
      setFeedback({ severity: "error", message: "Your name, email, and phone number are required." });
      return;
    }

    const interviewAnswers = interviewPrompts.map((prompt, index) => ({
      prompt,
      answer: String(formData.get(`answer_${index}`) || "").trim(),
    }));

    const submissionPayload = {
      messageType: kind as CompendiumMessageKind,
      fullName,
      email,
      phone,
      organization,
      headline,
      message: kind === "interview" ? "" : message,
      advertRate,
      responses: kind === "interview" ? interviewAnswers : [],
    };

    const bodyLines = [
      "King Sunny Ade @ 80 - Commemorative Compendium",
      "",
      `Message Type: ${messageKindLabel[kind]}`,
      `Full Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      organization ? `Organization: ${organization}` : "",
      advertRate ? `Advert Option: ${advertRate}` : "",
      headline ? `Headline / Title: ${headline}` : "",
      "",
      kind === "interview"
        ? [
            "Interview Responses:",
            ...interviewAnswers.map((item, index) => `${index + 1}. ${item.prompt}\n${item.answer || "[No answer provided]"}`),
          ].join("\n\n")
        : `Message:\n${message}`,
      "",
      "Payment Details",
      "Bank Name: Zenith Bank",
      "Account Name: Realitylife Magazine",
      "Account Number: 1014673949",
      "",
      `After payment, send your proof of payment receipt via WhatsApp to: 07066122290`,
    ]
      .filter(Boolean)
      .join("\n");

    setIsSubmitting(true);
    try {
      await submitCompendiumMessage(submissionPayload);
      window.location.href = buildMailtoHref(mailtoSubject, bodyLines);
      form.reset();
      setKind("congratulatory");
      setFeedback({
        severity: "success",
        message: `Your message is being prepared for ${emailAddress}.`,
      });
    } catch {
      setFeedback({ severity: "error", message: "Unable to prepare your email message." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Box sx={{ bgcolor: deepNavy, color: ivory, minHeight: "100vh" }}>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(11,18,32,0.96) 0%, rgba(17,28,51,0.88) 45%, rgba(181,139,42,0.34) 100%)",
          }}
        >
          <Box
            component="img"
            src={kingImage}
            alt="King Sunny Ade"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.2,
              filter: "saturate(0.95) contrast(1.05)",
            }}
          />
          <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 6, md: 10 } }}>
            <Box sx={{ maxWidth: 820 }}>
              <Typography sx={{ color: "#f6ddb2", fontWeight: 900, letterSpacing: 1, mb: 1.25 }}>
                COMMEMORATIVE COMPENDIUM
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 34, sm: 48, md: 66 },
                  lineHeight: 1.02,
                  fontWeight: 950,
                  mb: 2,
                }}
              >
                King Sunny Ade @ 80
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 17, md: 20 },
                  lineHeight: 1.8,
                  color: "#f2eadb",
                  maxWidth: 760,
                }}
              >
                Eight decades of grace, rhythm, and legacy. Share your goodwill message, congratulatory note,
                tribute, or fan interview and help us celebrate a true African icon.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  component="a"
                  href={`mailto:${emailAddress}`}
                  startIcon={<EmailOutlinedIcon />}
                  sx={{
                    bgcolor: "#f5e2b8",
                    color: "#1a1408",
                    fontWeight: 900,
                    textTransform: "none",
                    px: 2.5,
                    "&:hover": { bgcolor: "#ead08a" },
                  }}
                >
                  Email submissions
                </Button>
                <Button
                  component="a"
                  href="https://wa.me/2347066122290"
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontWeight: 800,
                    textTransform: "none",
                    px: 2.5,
                  }}
                >
                  WhatsApp receipt line
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 2.5, md: 4 },
              bgcolor: "#10192b",
              color: "#fff",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
                gap: { xs: 2.5, md: 3 },
                alignItems: "start",
              }}
            >
              <Box>
                <Typography sx={{ color: "#f5e2b8", fontWeight: 900, letterSpacing: 0.6, mb: 1 }}>
                  Authorization Letter
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1.1, mb: 2 }}>
                  Official authorization to compile and publish the Special Commemorative Compendium
                </Typography>
                <Typography sx={{ color: "#d7deea", lineHeight: 1.9, mb: 2 }}>
                  RealityLife Magazine has been duly authorised to compile, produce, print, publish, market and
                  distribute the official commemorative compendium for King Sunny Ade @ 80. The mandate includes
                  interviews, tributes, photographs, adverts, sponsorships, historical materials, and launch-related
                  management for the project lifecycle.
                </Typography>
                <Stack spacing={1.1} sx={{ mb: 2 }}>
                  {authorizationHighlights.map((item) => (
                    <Box key={item} sx={{ display: "flex", gap: 1.1, alignItems: "flex-start" }}>
                      <AutoStoriesIcon sx={{ color: "#f5e2b8", mt: 0.2 }} />
                      <Typography sx={{ color: "#eef3fb", lineHeight: 1.7 }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Typography sx={{ color: "#f5e2b8", fontWeight: 800, mb: 0.75 }}>
                  Why this matters
                </Typography>
                <Typography sx={{ color: "#d7deea", lineHeight: 1.8 }}>
                  This section helps subscribers and sponsors see the project as official, structured, and credible.
                  It strengthens confidence before they submit messages, adverts, or sponsorship support.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1.5,
                }}
              >
                {[authorizeImage, authorized2Image].map((image, index) => (
                  <Paper
                    key={image}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      borderRadius: { xs: 2, md: "50%" },
                      bgcolor: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.08)",
                      mx: "auto",
                      width: { xs: "100%", md: 260 },
                      maxWidth: { xs: "100%", md: 260 },
                      aspectRatio: { xs: "4 / 5", md: "1 / 1" },
                      p: { xs: 0, md: 1.25 },
                    }}
                  >
                    <Box
                      component="img"
                      src={image}
                      alt={index === 0 ? "Authorization letter" : "Authorization support letter"}
                      loading="lazy"
                      decoding="async"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        borderRadius: { xs: 0, md: "50%" },
                      }}
                    />
                  </Paper>
                ))}
              </Box>
            </Box>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: { xs: 3, lg: 4 },
              alignItems: "start",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 4 },
                bgcolor: paperBg,
                color: ivory,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
              }}
            >
              <Stack spacing={2.25}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={kingImage}
                    alt="King Sunny Ade portrait"
                    sx={{
                      width: { xs: "100%", sm: 180 },
                      height: { xs: 240, sm: 220 },
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <Box>
                    <Typography sx={{ color: "#f5e2b8", fontWeight: 900, mb: 0.75 }}>
                      Your Goodwill &amp; Congratulatory Messages
                    </Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.8 }}>
                      This is your special opportunity to honour a living legend. Share warm wishes, tributes,
                      words of appreciation, and prayers as we celebrate 80 years of excellence, music, and legacy.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    display: "grid",
                    gap: 2,
                  }}
                >
                  <TextField
                    select
                    name="kind"
                    label="Choose message type"
                    value={kind}
                    onChange={(event) => setKind(event.target.value as CompendiumMessageKind)}
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": { color: "#fff" },
                      "& .MuiInputLabel-root": { color: "#cbd5e1" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                    }}
                  >
                    <MenuItem value="interview">Interview</MenuItem>
                    <MenuItem value="tribute">Tribute</MenuItem>
                    <MenuItem value="goodwill">Goodwill Message</MenuItem>
                    <MenuItem value="congratulatory">Congratulatory Message</MenuItem>
                  </TextField>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                      gap: 1.5,
                    }}
                  >
                    <TextField
                      label="Full name"
                      name="fullName"
                      required
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff" },
                        "& .MuiInputLabel-root": { color: "#cbd5e1" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                      }}
                    />
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      required
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff" },
                        "& .MuiInputLabel-root": { color: "#cbd5e1" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                      }}
                    />
                    <TextField
                      label="Phone number"
                      name="phone"
                      required
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff" },
                        "& .MuiInputLabel-root": { color: "#cbd5e1" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                      }}
                    />
                  </Box>

                  {kind !== "interview" && (
                    <Stack spacing={2}>
                      <TextField
                        label="Organization or brand"
                        name="organization"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { color: "#fff" },
                          "& .MuiInputLabel-root": { color: "#cbd5e1" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                        }}
                      />
                      <TextField
                        label="Headline / title"
                        name="headline"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { color: "#fff" },
                          "& .MuiInputLabel-root": { color: "#cbd5e1" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                        }}
                      />
                      <TextField
                        label={
                          kind === "tribute"
                            ? "Your tribute"
                            : kind === "goodwill"
                              ? "Your goodwill message"
                              : "Your congratulatory message"
                        }
                        name="message"
                        multiline
                        minRows={7}
                        required
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { color: "#fff" },
                          "& .MuiInputLabel-root": { color: "#cbd5e1" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                        }}
                      />
                    </Stack>
                  )}

                  {kind === "interview" && (
                    <Stack spacing={2}>
                      <TextField
                        label="Headline / title"
                        name="headline"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { color: "#fff" },
                          "& .MuiInputLabel-root": { color: "#cbd5e1" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                        }}
                      />
                      {interviewPrompts.map((prompt, index) => (
                        <TextField
                          key={prompt}
                          label={prompt}
                          name={`answer_${index}`}
                          multiline
                          minRows={3}
                          fullWidth
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": { color: "#fff" },
                            "& .MuiInputLabel-root": { color: "#cbd5e1" },
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(245,226,184,0.08)",
                      border: "1px solid rgba(245,226,184,0.12)",
                    }}
                  >
                    <Typography sx={{ color: "#f5e2b8", fontWeight: 900 }}>Submission details</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.7 }}>
                      Send all congratulatory messages, write-ups, interview responses, and advert materials to:
                    </Typography>
                    <Typography sx={{ color: "#fff", fontWeight: 900 }}>{emailAddress}</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.7 }}>
                      Deadline: On or before 10 September 2026.
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    startIcon={<EmailOutlinedIcon />}
                    sx={{
                      bgcolor: gold,
                      color: "#161105",
                      fontWeight: 950,
                      textTransform: "none",
                      py: 1.3,
                      "&:hover": { bgcolor: "#d2a84f" },
                    }}
                  >
                    {isSubmitting ? "Preparing email..." : "Submit by email"}
                  </Button>
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={2.25}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  bgcolor: "#111C31",
                  color: "#fff",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Stack spacing={1.25}>
                  <Typography sx={{ color: "#f5e2b8", fontWeight: 900 }}>Advert placement rates</Typography>
                  {[
                    ["Half Page", "N300,000"],
                    ["Full Page", "N500,000"],
                    ["Inside Front Cover", "N700,000"],
                    ["Inside Back Cover", "N700,000"],
                    ["Centre Spread", "N800,000"],
                  ].map(([label, rate]) => (
                    <Box
                      key={label}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 1,
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                      <Typography sx={{ color: "#f5e2b8", fontWeight: 900 }}>{rate}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ pt: 1 }}>
                    <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Payment details</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.8 }}>Bank Name: Zenith Bank</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.8 }}>Account Name: Realitylife Magazine</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.8 }}>Account Number: 1014673949</Typography>
                    <Typography sx={{ color: "#d7deea", lineHeight: 1.8, mt: 1 }}>
                      After payment, send your proof of payment receipt via WhatsApp to 07066122290.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  bgcolor: "#171F2F",
                  color: "#fff",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ color: "#f5e2b8", fontWeight: 900, mb: 1.25 }}>What to share</Typography>
                <Stack spacing={1.2}>
                  {[
                    "Warm wishes and congratulations",
                    "Tributes and appreciation",
                    "Your favourite songs and memories",
                    "Fan reflections and personal stories",
                    "Interview responses to the 5 questions",
                  ].map((item) => (
                    <Box key={item} sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
                      <AutoStoriesIcon sx={{ color: "#f5e2b8", mt: 0.2, fontSize: 20 }} />
                      <Typography sx={{ color: "#d7deea", lineHeight: 1.7 }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Container>

        <Footer />
      </Box>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={feedback?.severity || "success"} onClose={() => setFeedback(null)} variant="filled">
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default KingSunnyAdeCompendiumScreen;
