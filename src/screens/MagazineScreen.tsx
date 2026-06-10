import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DownloadIcon from "@mui/icons-material/Download";
import LockIcon from "@mui/icons-material/Lock";
import PaymentIcon from "@mui/icons-material/Payment";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/useAuth";
import { loadMagazines, type PostItem } from "../services/contentApi";

const pageBg = "#070B14";
const panelBg = "#0F172A";
const gold = "#C9A24A";
const ivory = "#F8F2E8";
const muted = "#CBD5E1";
const bankName = "Zenith Bank";
const accountName = "Realitylife Magazine";
const accountNumber = "1014673949";
const receiptLine = "07066122290";

const shellEffect = {
  background:
    "radial-gradient(circle at top left, rgba(201,162,74,0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 30%), linear-gradient(135deg, rgba(7,11,20,1) 0%, rgba(12,18,33,1) 50%, rgba(18,55,42,0.8) 100%)",
};

const MagazineScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, requestMagazine } = useAuth();
  const [magazines, setMagazines] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [unlockingId, setUnlockingId] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMagazineIssues = async () => {
      try {
        const items = await loadMagazines();
        if (!mounted) return;
        setMagazines(items);
      } catch {
        if (mounted) {
          setMagazines([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadMagazineIssues();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredIssue = useMemo(() => magazines[0] || null, [magazines]);

  const magazineAccessStatus = user?.magazineAccessStatus || "none";
  const canDownload = magazineAccessStatus === "approved";
  const accessLabel =
    magazineAccessStatus === "approved"
      ? "Approved access"
      : magazineAccessStatus === "pending"
        ? "Payment awaiting approval"
        : magazineAccessStatus === "rejected"
          ? "Payment rejected"
          : "Download locked";

  const handleRequestAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!reference.trim()) {
      setFeedback({ severity: "error", message: "Enter your payment reference or receipt number." });
      return;
    }

    setSubmittingRequest(true);
    try {
      await requestMagazine(reference.trim(), note.trim() || undefined);
      setReference("");
      setNote("");
      setFeedback({
        severity: "success",
        message: "Your payment proof was submitted. An admin will approve it shortly.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to submit your payment proof.",
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const openDownload = async (item: PostItem) => {
    if (!item._id) {
      setFeedback({ severity: "error", message: "This issue does not have a download record yet." });
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!canDownload) {
      setFeedback({
        severity: "error",
        message: "Your payment has not been approved yet. Please submit your proof of payment first.",
      });
      return;
    }

    setUnlockingId(item._id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${item._id}/download`, {
        headers: {
          ...(window.localStorage.getItem("realitylife_admin_token")
            ? { Authorization: `Bearer ${window.localStorage.getItem("realitylife_admin_token")}` }
            : {}),
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.error || "Unable to unlock this magazine.");
      }

      const payload = (await response.json()) as { downloadUrl?: string };
      const downloadUrl = payload.downloadUrl || item.downloadUrl || item.coverImage || item.image;

      if (!downloadUrl) {
        throw new Error("This issue does not have a downloadable file yet.");
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to unlock this magazine.",
      });
    } finally {
      setUnlockingId("");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, color: ivory }}>
      <Box sx={{ ...shellEffect, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
          <Stack spacing={3} sx={{ maxWidth: 960 }}>
            <Chip
              label="Digital Magazine Library"
              sx={{ alignSelf: "flex-start", bgcolor: "rgba(201,162,74,0.16)", color: "#f7ddad", fontWeight: 900 }}
            />
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 34, sm: 48, md: 66 },
                lineHeight: 1.02,
                fontWeight: 950,
                letterSpacing: "-1.5px",
                maxWidth: 880,
              }}
            >
              Read, browse, and unlock RealityLife Magazine issues
            </Typography>
            <Typography sx={{ color: "#d6deea", lineHeight: 1.9, maxWidth: 820, fontSize: { xs: 16, md: 18 } }}>
              A premium editorial storefront for cover previews, archival issues, and approved PDF downloads. Browse
              the latest editions, submit payment proof, and unlock the full magazine after admin approval.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                onClick={() => document.getElementById("magazine-catalog")?.scrollIntoView({ behavior: "smooth" })}
                sx={{
                  bgcolor: gold,
                  color: "#141008",
                  textTransform: "none",
                  fontWeight: 900,
                  px: 3,
                  "&:hover": { bgcolor: "#e2bb5a" },
                }}
              >
                Browse issues
              </Button>
              <Button
                onClick={() => document.getElementById("payment-gate")?.scrollIntoView({ behavior: "smooth" })}
                sx={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 800,
                  px: 3,
                }}
              >
                Submit payment proof
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
            gap: { xs: 2.5, md: 3 },
            alignItems: "start",
            mb: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              overflow: "hidden",
              bgcolor: panelBg,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <AutoStoriesIcon sx={{ color: gold }} />
                <Typography sx={{ fontWeight: 900, color: "#fff" }}>Current edition</Typography>
              </Box>
              {featuredIssue ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
                    gap: 2.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={featuredIssue.coverImage || featuredIssue.image}
                    alt={featuredIssue.title}
                    sx={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <Stack spacing={1.5}>
                    <Typography sx={{ color: "#f7e3bc", fontWeight: 900, letterSpacing: 0.4 }}>
                      Featured release
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                      {featuredIssue.title}
                    </Typography>
                    <Typography sx={{ color: muted, lineHeight: 1.85 }}>
                      {featuredIssue.desc || "A premium magazine issue with a secure full download for approved readers."}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Chip
                        icon={canDownload ? <VerifiedIcon /> : <LockIcon />}
                        label={accessLabel}
                        sx={{
                          bgcolor: canDownload ? "rgba(18,55,42,0.32)" : "rgba(201,162,74,0.16)",
                          color: canDownload ? "#bbf7d0" : "#f7ddad",
                          fontWeight: 800,
                        }}
                      />
                      <Chip
                        icon={<PaymentIcon />}
                        label={`Pay to ${accountNumber}`}
                        sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 800 }}
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button
                        onClick={() => void openDownload(featuredIssue)}
                        disabled={loading || Boolean(unlockingId) || !canDownload}
                        startIcon={canDownload ? <DownloadIcon /> : <LockIcon />}
                        sx={{
                          bgcolor: canDownload ? gold : "rgba(255,255,255,0.08)",
                          color: canDownload ? "#120d02" : "#fff",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: canDownload ? "#e2bb5a" : "rgba(255,255,255,0.12)" },
                        }}
                      >
                        {canDownload ? "Download issue" : "Download locked"}
                      </Button>
                      <Button
                        onClick={() => document.getElementById("payment-gate")?.scrollIntoView({ behavior: "smooth" })}
                        sx={{
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "#fff",
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Get access
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Stack spacing={1.25}>
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>
                      New editions are being prepared
                    </Typography>
                    <Typography sx={{ color: muted, lineHeight: 1.85 }}>
                      The magazine archive will appear here as soon as the next issue is published. Each cover is shown
                      first, and the full PDF becomes available only after payment approval.
                    </Typography>
                    <Typography sx={{ color: "#f7ddad", fontWeight: 700 }}>
                      Readers can still review the payment details below and prepare their access request.
                    </Typography>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Paper>

          <Paper
            id="payment-gate"
            elevation={0}
            sx={{
              bgcolor: "#10192b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <AccountBalanceIcon sx={{ color: "#f7ddad" }} />
                <Typography sx={{ color: "#fff", fontWeight: 900 }}>Payment instructions</Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ color: "#f7ddad", fontWeight: 900, mb: 0.5 }}>{bankName}</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 800 }}>{accountName}</Typography>
                <Typography sx={{ color: "#fff", fontSize: 22, fontWeight: 950, letterSpacing: 1, mt: 0.75 }}>
                  {accountNumber}
                </Typography>
                <Typography sx={{ color: "#cbd5e1", mt: 1.25, lineHeight: 1.75 }}>
                  Transfer the magazine fee to the account above, then submit your payment reference below. After
                  admin approval, your download button unlocks automatically.
                </Typography>
                <Typography sx={{ color: "#cbd5e1", mt: 1.25 }}>
                  WhatsApp receipt line: <Box component="span" sx={{ color: "#fff", fontWeight: 900 }}>{receiptLine}</Box>
                </Typography>
              </Box>

              <Box
                component="form"
                onSubmit={handleRequestAccess}
                sx={{ display: "grid", gap: 1.5 }}
              >
                {!user && (
                  <Alert severity="info" sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "#fff" }}>
                    Sign in first so we can link your payment proof to your account.
                  </Alert>
                )}
                <TextField
                  label="Payment reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  fullWidth
                  placeholder="Receipt number, transfer reference, or teller number"
                  sx={{
                    "& .MuiOutlinedInput-root": { color: "#fff" },
                    "& .MuiInputLabel-root": { color: "#cbd5e1" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                  }}
                />
                <TextField
                  label="Note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Optional note for the admin"
                  sx={{
                    "& .MuiOutlinedInput-root": { color: "#fff" },
                    "& .MuiInputLabel-root": { color: "#cbd5e1" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                  }}
                />
                <Button
                  type="submit"
                  disabled={submittingRequest}
                  sx={{
                    bgcolor: gold,
                    color: "#120d02",
                    textTransform: "none",
                    fontWeight: 900,
                    "&:hover": { bgcolor: "#e2bb5a" },
                  }}
                >
                  {magazineAccessStatus === "pending" ? "Update proof of payment" : "Submit proof of payment"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Paper
          id="magazine-catalog"
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            bgcolor: "#0b1220",
            border: "1px solid rgba(255,255,255,0.08)",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2.5, alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: 22, md: 28 } }}>
                Issue archive
              </Typography>
              <Typography sx={{ color: muted, mt: 0.75 }}>
                A clean digital storefront for covers, archives, and premium downloads.
              </Typography>
            </Box>
            <Chip
              label={magazines.length ? `${magazines.length} issues` : "Curated archive"}
              sx={{ bgcolor: "rgba(201,162,74,0.16)", color: "#f7ddad", fontWeight: 900 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
              <Typography sx={{ color: "#fff", fontWeight: 800 }}>Loading magazine issues...</Typography>
            </Box>
          ) : magazines.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              {magazines.map((issue, index) => {
                const issueKey = issue._id || `${issue.title}-${index}`;
                const locked = !canDownload;
                const coverSrc = issue.coverImage || issue.image;

                return (
                  <Paper
                    key={issueKey}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      bgcolor: "#10192b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      display: "grid",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={coverSrc}
                        alt={issue.title}
                        sx={{
                          width: "100%",
                          aspectRatio: "4 / 5",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <Chip
                        icon={locked ? <LockIcon /> : <VerifiedIcon />}
                        label={locked ? "Locked" : "Available"}
                        sx={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          bgcolor: locked ? "rgba(12,18,33,0.82)" : "rgba(18,55,42,0.88)",
                          color: "#fff",
                          fontWeight: 900,
                        }}
                      />
                    </Box>

                    <Stack spacing={1.4} sx={{ p: 2.25 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>
                        {issue.title}
                      </Typography>
                      <Typography sx={{ color: muted, lineHeight: 1.75 }}>
                        {issue.desc || "Magazine issue preview with a polished cover and secure download access."}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Chip
                          icon={<PaymentIcon />}
                          label={canDownload ? "Approved" : "Pay first"}
                          sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 800 }}
                        />
                        <Chip
                          label={issue.downloadUrl ? "PDF ready" : "Preview only"}
                          sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 800 }}
                        />
                      </Stack>
                      <Button
                        onClick={() => void openDownload(issue)}
                        disabled={locked || Boolean(unlockingId)}
                        startIcon={locked ? <LockIcon /> : <DownloadIcon />}
                        sx={{
                          bgcolor: locked ? "rgba(255,255,255,0.08)" : gold,
                          color: locked ? "#fff" : "#120d02",
                          textTransform: "none",
                          fontWeight: 900,
                          "&:hover": { bgcolor: locked ? "rgba(255,255,255,0.12)" : "#e2bb5a" },
                        }}
                      >
                        {locked ? "Locked until approved" : "Download issue"}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack spacing={1.5}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>
                  The archive is currently being curated
                </Typography>
                <Typography sx={{ color: muted, lineHeight: 1.9, maxWidth: 840 }}>
                  Once a magazine issue is published, viewers will see the cover only, then submit payment proof to
                  unlock the downloadable PDF after approval. That keeps the experience polished, intentional, and
                  premium from the very first visit.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2.25,
            mb: 4,
          }}
        >
          {[
            {
              title: "A premium archive",
              text: "Cover-first layouts, clean spacing, and strong hierarchy keep the magazine catalog professional.",
            },
            {
              title: "Payment approval",
              text: "Readers submit proof of payment and admins approve access before downloads unlock.",
            },
            {
              title: "Secure delivery",
              text: "Approved readers access the download through the backend, not just a visible public file link.",
            },
          ].map((item) => (
            <Paper
              key={item.title}
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#0f172a",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 900, mb: 1 }}>{item.title}</Typography>
              <Typography sx={{ color: muted, lineHeight: 1.8 }}>{item.text}</Typography>
            </Paper>
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            bgcolor: panelBg,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 22, mb: 1.25 }}>
            Why this matters
          </Typography>
          <Typography sx={{ color: muted, lineHeight: 1.9, maxWidth: 980 }}>
            The magazine library should feel trustworthy before readers spend money. A structured catalog, visible bank
            details, and an admin approval gate make the experience feel official and credible, similar to premium
            digital magazine platforms.
          </Typography>
        </Paper>
      </Container>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={feedback?.severity || "success"} variant="filled" onClose={() => setFeedback(null)}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MagazineScreen;
