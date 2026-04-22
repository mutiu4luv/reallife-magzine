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
  { label: "Blog", path: "/blog" },

];

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#000", boxShadow: "none" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 80, md: 100 },
          }}
        >
          <Box
            component="img"
            src={heroImage}
            alt="Logo"
            onClick={() => navigate("/")}
            sx={{
              height: { xs: 70, md: 80 },
              width: { xs: 140, md: 180 },
              objectFit: "contain",
              cursor: "pointer",
            }}
          />

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                onClick={() => navigate(link.path)}
                sx={{ color: "#fff", "&:hover": { color: "#FFD700" } }}
              >
                {link.label}
              </Button>
            ))}
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
        <Box sx={{ width: 260, bgcolor: "#fff", height: "100%", pt: 4 }}>
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
                    primary={link.label}
                    slotProps={{
                      primary: {
                        sx: { color: "#000", fontWeight: 600 },
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