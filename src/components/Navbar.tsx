import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";
import heroImage from "../assets/hero.jpeg";
import { useAuth } from "../context/useAuth";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Contact", path: "/contact" },
  { label: "Profile", path: "/profile" },
  { label: "Blog", path: "/blog" },
  { label: "Magazine", path: "/magazine" },
  { label: "News", path: "/news" },
  { label: "Events", path: "/events" },
  { label: "KSA@80", path: "/king--Sunny-Ade-@80" },
];

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#000", boxShadow: "none" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 72, sm: 80, md: 96 },
            px: { xs: 2, sm: 3, md: 5 },
            gap: 2,
          }}
        >
          <Box
            component="img"
            src={heroImage}
            alt="Logo"
            onClick={() => navigate("/")}
            sx={{
              height: { xs: 58, sm: 68, md: 80 },
              width: { xs: 116, sm: 146, md: 180 },
              objectFit: "contain",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: { md: 1.5, lg: 3 },
              alignItems: "center",
            }}
          >
            {navLinks.map((link) => {
              const active = isActiveLink(link.path);

              return (
                <Button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: active ? "#FFD700" : "#fff",
                    minWidth: 0,
                    px: { md: 1, lg: 1.5 },
                    fontWeight: active ? 700 : 500,
                    borderBottom: active ? "2px solid #FFD700" : "2px solid transparent",
                    borderRadius: 0,
                    "&:hover": {
                      color: "#FFD700",
                      borderBottom: "2px solid #FFD700",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
            <Button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              sx={{
                bgcolor: "#FFD700",
                color: "#000",
                fontWeight: 900,
                textTransform: "none",
                px: 2.2,
                ml: 1,
                "&:hover": { bgcolor: "#f6c800" },
              }}
            >
              {user ? "Dashboard" : "Login"}
            </Button>
          </Box>

          <IconButton
            sx={{ display: { xs: "block", md: "none" }, color: "#fff" }}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: { xs: "min(82vw, 280px)", sm: 300 },
            bgcolor: "#fff",
            height: "100%",
            pt: 4,
          }}
        >
          <List>
            {navLinks.map((link) => {
              const active = isActiveLink(link.path);

              return (
                <ListItem key={link.label} disablePadding>
                  <ListItemButton
                    selected={active}
                    onClick={() => {
                      setOpen(false);
                      navigate(link.path);
                    }}
                    sx={{
                      borderLeft: active ? "4px solid #FFD700" : "4px solid transparent",
                      bgcolor: active ? "rgba(255, 215, 0, 0.15)" : "transparent",
                      "&:hover": {
                        bgcolor: "rgba(255, 215, 0, 0.15)",
                      },
                      "&.Mui-selected": {
                        bgcolor: "rgba(255, 215, 0, 0.2)",
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: "rgba(255, 215, 0, 0.25)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={link.label}
                      slotProps={{
                        primary: {
                          sx: {
                            color: active ? "#000" : "#000",
                            fontWeight: active ? 800 : 600,
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            <ListItem disablePadding sx={{ mt: 1 }}>
              <ListItemButton
                onClick={() => {
                  setOpen(false);
                  navigate(user ? "/dashboard" : "/login");
                }}
                sx={{
                  borderLeft: "4px solid transparent",
                  bgcolor: "rgba(255, 215, 0, 0.1)",
                  "&:hover": { bgcolor: "rgba(255, 215, 0, 0.18)" },
                }}
              >
                <ListItemText
                  primary={user ? "Dashboard" : "Login"}
                  slotProps={{
                    primary: {
                      sx: {
                        color: "#000",
                        fontWeight: 800,
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
