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
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.jpeg";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Contact", path: "/contact" },
  { label: "Profile", path: "/profile" },
  { label: "Career", path: "/internship" },
];

const Navbar: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#000000", // matches logo background
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,215,0,0.15)", // soft gold line
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 6 },
            minHeight: { xs: 70, md: 90 },
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src={heroImage}
            alt="RealityLife Magazine Logo"
            onClick={() => navigate("/")}
            sx={{
              height: { xs: 45, md: 60 },
              cursor: "pointer",
              imageRendering: "crisp-edges",
            }}
          />

          {/* Desktop Links */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 4,
              alignItems: "center",
            }}
          >
            {navLinks.map((link) => (
              <Button
                key={link.label}
                onClick={() => navigate(link.path)}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "1rem",
                  color: "#ffffff",
                  position: "relative",
                  "&:hover": {
                    color: "#FFD700",
                    backgroundColor: "transparent",
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Mobile Menu */}
          <IconButton
            sx={{ display: { xs: "block", md: "none" }, color: "#fff" }}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 260,
            height: "100%",
            bgcolor: "#fff",
            pt: 4,
          }}
        >
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setOpen(false);
                    navigate(link.path);
                  }}
                >
                  <ListItemText
  primary="Home"
  slotProps={{
    primary: {
      sx: {
        color: "white",
        "&:hover": { color: "yellow" },
      },
    },
  }}
/> 
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;