import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  ButtonBase,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LockIcon from "@mui/icons-material/Lock";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/useAuth";
import { loadMagazines, type PostItem } from "../services/contentApi";

const pageBg = "#070B14";
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
  const [pageMeta, setPageMeta] = useState({ page: 1, limit: 8, total: 0, hasMore: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [unlockingId, setUnlockingId] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMagazineIssues = async () => {
      setLoading(true);
      try {
        const { items, meta } = await loadMagazines(currentPage, 8);
        if (!mounted) return;
        setMagazines(items);
        setPageMeta(meta);
      } catch {
        if (mounted) {
          setMagazines([]);
          setPageMeta({ page: currentPage, limit: 8, total: 0, hasMore: false });
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
  }, [currentPage]);

  const magazineAccessStatus = user?.magazineAccessStatus || "none";
  const canDownload = magazineAccessStatus === "approved";

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

  const handleCoverClick = (item: PostItem) => {
    void openDownload(item);
  };

  const pageCount = Math.max(1, Math.ceil(pageMeta.total / pageMeta.limit));

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
              RealityLife Magazine
            </Typography>
            <Typography sx={{ color: "#d6deea", lineHeight: 1.9, maxWidth: 820, fontSize: { xs: 16, md: 18 } }}>
              Browse the latest covers in a premium digital newsstand. Register or log in to unlock downloads after
              your payment has been approved.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                onClick={() => document.getElementById("magazines-grid")?.scrollIntoView({ behavior: "smooth" })}
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
            gridTemplateColumns: { xs: "1fr", lg: "0.95fr 1.05fr" },
            gap: { xs: 2.5, md: 3 },
            alignItems: "start",
            mb: 4,
          }}
        >
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
                  WhatsApp receipt line:{" "}
                  <Box component="span" sx={{ color: "#fff", fontWeight: 900 }}>
                    {receiptLine}
                  </Box>
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleRequestAccess} sx={{ display: "grid", gap: 1.5 }}>
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

          <Box
            sx={{
              display: "grid",
              gap: 2,
              alignContent: "start",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack spacing={1.25}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>
                  Download your magazine by tapping the cover
                </Typography>
                <Typography sx={{ color: muted, lineHeight: 1.85 }}>
                  If you are not logged in, the cover will prompt you to register or log in before downloading. Approved
                  readers can tap any cover to open the document instantly.
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>

        <Paper
          id="magazines-grid"
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
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: 22, md: 28 } }}>Magazines</Typography>
              <Typography sx={{ color: muted, mt: 0.75 }}>
                A clean digital storefront for covers and premium downloads.
              </Typography>
            </Box>
            <Chip
              label={pageMeta.total ? `${pageMeta.total} magazines` : "No magazines yet"}
              sx={{ bgcolor: "rgba(201,162,74,0.16)", color: "#f7ddad", fontWeight: 900 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
              <Typography sx={{ color: "#fff", fontWeight: 800 }}>Loading magazines...</Typography>
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
                gap: 2.25,
              }}
            >
              {magazines.map((issue, index) => {
                const issueKey = issue._id || `${issue.title}-${index}`;
                const locked = !canDownload;
                const coverSrc = issue.coverImage || issue.image;
                const isLatest = currentPage === 1 && index === 0;
                const coverLabel = !user
                  ? "Login or register to download"
                  : canDownload
                    ? "Tap cover to download"
                    : "Payment approved to unlock";

                return (
                  <Paper
                    key={issueKey}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      bgcolor: "#0e1524",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 4,
                      boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
                      display: "grid",
                    }}
                  >
                    <ButtonBase
                      onClick={() => handleCoverClick(issue)}
                      disabled={Boolean(unlockingId) || (user ? locked : false)}
                      sx={{
                        width: "100%",
                        display: "block",
                        textAlign: "left",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ position: "relative" }}>
                        <Box
                          component="img"
                          src={coverSrc}
                          alt={issue.title}
                          loading="lazy"
                          decoding="async"
                          sx={{
                            width: "100%",
                            aspectRatio: "4 / 5",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <Chip
                          icon={!user ? <LockIcon /> : locked ? <LockIcon /> : <VerifiedIcon />}
                          label={coverLabel}
                          sx={{
                            position: "absolute",
                            top: 14,
                            left: 14,
                            bgcolor: !user
                              ? "rgba(12,18,33,0.86)"
                              : locked
                                ? "rgba(12,18,33,0.82)"
                                : "rgba(18,55,42,0.88)",
                            color: "#fff",
                            fontWeight: 900,
                            maxWidth: "calc(100% - 28px)",
                          }}
                        />
                        {isLatest && (
                          <Chip
                            label="Latest"
                            sx={{
                              position: "absolute",
                              top: 14,
                              right: 14,
                              bgcolor: "rgba(201,162,74,0.92)",
                              color: "#120d02",
                              fontWeight: 900,
                            }}
                          />
                        )}
                      </Box>
                    </ButtonBase>

                    <Stack spacing={1} sx={{ p: 2.25 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>
                        {issue.title}
                      </Typography>
                      <Typography sx={{ color: muted, fontSize: 13.5, lineHeight: 1.7 }}>
                        {user
                          ? canDownload
                            ? "Approved readers can tap the cover to download."
                            : "Complete payment approval to unlock the issue."
                          : "Register or log in before downloading the full document."}
                      </Typography>
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
                  No magazines are available yet
                </Typography>
                <Typography sx={{ color: muted, lineHeight: 1.9, maxWidth: 840 }}>
                  New covers will appear here as soon as the next issue is published and approved for display.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Paper>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            mb: 4,
            p: 2,
            borderRadius: 2.5,
            bgcolor: "#0b1220",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1 || loading}
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#fff",
              textTransform: "none",
              fontWeight: 800,
              px: 2.5,
            }}
          >
            Previous
          </Button>

          <Typography sx={{ color: muted, fontWeight: 700 }}>
            Page {currentPage} of {pageCount} · {pageMeta.total} magazines
          </Typography>

          <Button
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={!pageMeta.hasMore || loading}
            sx={{
              bgcolor: gold,
              color: "#120d02",
              textTransform: "none",
              fontWeight: 900,
              px: 2.5,
              "&:hover": { bgcolor: "#e2bb5a" },
            }}
          >
            Next
          </Button>
        </Box>
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
