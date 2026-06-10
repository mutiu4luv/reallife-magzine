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
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { LockOpen, PersonAdd, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../context/useAuth";

type AuthScreenProps = {
  mode: "login" | "register";
};

const gold = "#A67C1B";
const green = "#12372A";

const getFriendlyAuthMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message.trim() : "";

  if (!message) {
    return fallback;
  }

  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or phone number, or password.";
  }

  if (normalizedMessage.includes("email or phonenumber and password are required")) {
    return "Email or phone number and password are required.";
  }

  if (normalizedMessage.includes("unable to login")) {
    return "Unable to login. Please try again.";
  }

  if (normalizedMessage.includes("unable to register")) {
    return "Unable to register. Please try again.";
  }

  return message;
};

const getPostLoginPath = (userRole: string, permissions: Array<string>) => {
  if (userRole === "admin" || permissions.length > 0) {
    return "/admin";
  }

  if (userRole === "blogger") {
    return "/blogger";
  }

  return "/";
};

const AuthScreen: React.FC<AuthScreenProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user, login, register, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const isRegister = mode === "register";

  const title = useMemo(() => (isRegister ? "Create account" : "Login"), [isRegister]);

  if (!isLoading && user) {
    return <Navigate to={getPostLoginPath(user.role, user.permissions || [])} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phonenumber = String(formData.get("phonenumber") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const identifier = String(formData.get("identifier") || "").trim();
    const password = String(formData.get("password") || "");

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (isRegister) {
        if (!name || !email || !phonenumber || !address || !state || !password) {
          setFeedback({
            severity: "error",
            message: "All registration fields are required.",
          });
          return;
        }

        const registeredUser = await register({
          name,
          email,
          phonenumber,
          password,
          address,
          state,
        });

        navigate(getPostLoginPath(registeredUser.role, registeredUser.permissions || []), { replace: true });
        return;
      }

      if (!identifier || !password) {
        setFeedback({
          severity: "error",
          message: "Email or phone number and password are required.",
        });
        return;
      }

      const loggedInUser = await login(
        identifier,
        password
      );

      navigate(getPostLoginPath(loggedInUser.role, loggedInUser.permissions || []), { replace: true });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getFriendlyAuthMessage(error, isRegister ? "Unable to register." : "Unable to login."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#080806",
        color: "#fff",
        py: { xs: 5, md: 8 },
        display: "grid",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 2,
            bgcolor: "#fffaf0",
            border: "1px solid rgba(166,124,27,0.28)",
            color: "#15130f",
          }}
        >
          <Stack spacing={2.2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: green,
                  color: "#f1d68a",
                }}
              >
                {isRegister ? <PersonAdd /> : <LockOpen />}
              </Box>
              <Box>
                <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 34 }, lineHeight: 1.05, fontWeight: 950 }}>
                  {title}
                </Typography>
                <Typography sx={{ color: "#6d6250", fontWeight: 700, mt: 0.5 }}>
                  {isRegister ? "Every new account starts as a user." : "Use email or phonenumber and password."}
                </Typography>
              </Box>
            </Box>

            {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}

            {isRegister ? (
              <>
                <TextField required label="Name" name="name" fullWidth />
                <TextField required label="Email" name="email" type="email" fullWidth />
                <TextField required label="Phonenumber" name="phonenumber" fullWidth />
                <TextField required label="Address" name="address" fullWidth />
                <TextField required label="State" name="state" fullWidth />
              </>
            ) : (
              <TextField required label="Email or phonenumber" name="identifier" fullWidth />
            )}

            <TextField
              required
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((value) => !value)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              sx={{
                minHeight: 46,
                bgcolor: green,
                color: "#fff",
                textTransform: "none",
                fontWeight: 900,
                "&:hover": { bgcolor: gold },
              }}
            >
              {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Login"}
            </Button>

            <Button
              component={RouterLink}
              to={isRegister ? "/login" : "/register"}
              sx={{ color: gold, textTransform: "none", fontWeight: 900 }}
            >
              {isRegister ? "Already have an account? Login" : "Need an account? Register"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthScreen;
