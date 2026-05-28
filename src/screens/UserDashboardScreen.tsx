import React, { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../context/useAuth";

const green = "#12372A";

const UserDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, requestBlogger, changePassword, logout } = useAuth();
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const canOpenAdminTools = useMemo(() => user?.role === "admin" || user?.role === "blogger", [user?.role]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleBloggerRequest = async () => {
    setFeedback(null);
    setIsSubmitting(true);
    try {
      await requestBlogger();
      setFeedback({ severity: "success", message: "Blogger request submitted. An admin can approve it." });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to request blogger access.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await changePassword(
        String(formData.get("currentPassword") || ""),
        String(formData.get("newPassword") || ""),
        String(formData.get("confirmPassword") || "")
      );
      setFeedback({ severity: "success", message: "Password changed. Please login again." });
      navigate("/login", { replace: true });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to change password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", py: { xs: 4, md: 7 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Typography component="h1" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#171a20" }}>
                  User dashboard
                </Typography>
                <Typography sx={{ color: "#667085", fontWeight: 700 }}>
                  {user.name} - {user.email} - {user.role}
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {canOpenAdminTools && (
                  <Button onClick={() => navigate("/admin")} sx={{ bgcolor: green, color: "#fff", textTransform: "none", fontWeight: 900 }}>
                    Open admin tools
                  </Button>
                )}
                <Button onClick={() => void handleLogout()} sx={{ color: "#b42318", border: "1px solid #fda29b", textTransform: "none", fontWeight: 900 }}>
                  Logout
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: 3 }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Request blogger access
                  </Typography>
                  <Typography sx={{ color: "#667085", mt: 0.5 }}>
                    Bloggers can create, update, and delete blogs, news, events, past editions, testimonies, interviews, and gallery photos.
                  </Typography>
                </Box>

                {user.permissionRequestStatus === "pending" && (
                  <Alert severity="info">Your blogger request is pending approval.</Alert>
                )}

                {user.role === "blogger" ? (
                  <Alert severity="success">You already have blogger access.</Alert>
                ) : (
                  <Button
                    onClick={() => void handleBloggerRequest()}
                    disabled={isSubmitting || user.permissionRequestStatus === "pending"}
                    sx={{ alignSelf: "flex-start", bgcolor: green, color: "#fff", textTransform: "none", fontWeight: 900 }}
                  >
                    Request blogger access
                  </Button>
                )}
              </Stack>
            </Paper>

            <Paper component="form" onSubmit={handlePasswordChange} elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid #e6e8ec", borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Change password
                  </Typography>
                  <Typography sx={{ color: "#667085", mt: 0.5 }}>
                    Current password must match your original password.
                  </Typography>
                </Box>
                {["currentPassword", "newPassword", "confirmPassword"].map((name) => (
                  <TextField
                    key={name}
                    required
                    label={name === "currentPassword" ? "Current password" : name === "newPassword" ? "New password" : "Confirm new password"}
                    name={name}
                    type={showPasswords ? "text" : "password"}
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPasswords((value) => !value)} edge="end">
                              {showPasswords ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                ))}
                <Button type="submit" disabled={isSubmitting} sx={{ alignSelf: "flex-start", bgcolor: "#111318", color: "#fff", textTransform: "none", fontWeight: 900 }}>
                  Change password
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default UserDashboardScreen;
