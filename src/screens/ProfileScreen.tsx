import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Avatar,
  Paper,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import owner from "../assets/owner.jpeg";

const gold = "#A67C1B";
const whatsappLink = "https://wa.me/message/JW2BTKJVKKI6K1";

/* ANIMATIONS */
const left = { hidden: { opacity: 0, x: -80 }, show: { opacity: 1, x: 0 } };
const right = { hidden: { opacity: 0, x: 80 }, show: { opacity: 1, x: 0 } };
const up = { hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0 } };

/* UNDERLINE STYLE */
const titleStyle = {
  fontWeight: 800,
  position: "relative",
  display: "inline-block",
  mb: 2,
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    bottom: -6,
    width: "100%",
    height: "3px",
    background: `linear-gradient(to right, ${gold}, transparent)`,
    animation: "slideLine 1.8s linear infinite alternate",
  },
};

const globalStyle = `
@keyframes slideLine {
  0% { transform: scaleX(0.3); transform-origin: left; }
  100% { transform: scaleX(1); transform-origin: left; }
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}
`;

const ProfileScreen: React.FC = () => {
  /* ✅ HOOKS INSIDE COMPONENT (FIXED) */
  const fullText = "RealityLife Magazine";
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + fullText[index]);
        setIndex(index + 1);
      }, 120);

      return () => clearTimeout(timeout);
    }
  }, [index, fullText]);

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", color: "#fff", py: 6 }}>
        <style>{globalStyle}</style>

        <Container maxWidth="md">

          {/* HERO */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: false }} variants={up}>
            <Paper sx={{ p: 5, borderRadius: 4, bgcolor: "#fff", color: "#111", position: "relative" }}>
              
              <Box
                sx={{
                  position: "absolute",
                  top: -120,
                  right: -120,
                  width: 280,
                  height: 280,
                  bgcolor: gold,
                  opacity: 0.15,
                  filter: "blur(60px)",
                  borderRadius: "50%",
                }}
              />

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>

                {/* OWNER IMAGE */}
                <Avatar
                  src={owner}
                  sx={{ width: 120, height: 120, border: `3px solid ${gold}` }}
                />

                <Box sx={{ flex: 1 }}>

                  {/* TYPEWRITER TITLE */}
                  <Typography variant="h4" sx={titleStyle}>
                    {text}
                    <Box
                      component="span"
                      sx={{
                        ml: 0.5,
                        width: 2,
                        height: 28,
                        bgcolor: gold,
                        display: "inline-block",
                        animation: "blink 0.8s infinite",
                      }}
                    />
                  </Typography>

                  <Typography sx={{ color: "#444", mb: 1 }}>
                    Founded by <b style={{ color: gold }}>Oghenemairo Adegeye</b>
                  </Typography>

                  <Typography sx={{ color: "#666", lineHeight: 1.7 }}>
                    A digital storytelling platform focused on real African voices,
                    culture, leadership, and impactful human stories.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                    <Chip label="Founder-led" />
                    <Chip label="Media Platform" />
                    <Chip label="Africa Focused" sx={{ bgcolor: gold, color: "#000" }} />
                  </Box>
                </Box>

                <Button
                  onClick={() => window.open(whatsappLink, "_blank")}
                  sx={{ bgcolor: gold, color: "#000", fontWeight: 700 }}
                >
                  Contact Founder
                </Button>
              </Box>
            </Paper>
          </motion.div>

          {/* MISSION */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: false }} variants={left}>
            <Paper sx={{ mt: 4, p: 4, borderRadius: 4, bgcolor: "#fff", color: "#111" }}>
              <Typography sx={titleStyle} variant="h6">
                Mission
              </Typography>
              <Typography sx={{ color: "#555", lineHeight: 1.9 }}>
                RealityLife Magazine exists to document real human experiences and amplify African voices globally.
              </Typography>
            </Paper>
          </motion.div>

          {/* CARDS */}
          <Box sx={{ display: "flex", gap: 2, mt: 4, flexWrap: "wrap" }}>
            {[
              { title: "Vision", text: "Africa’s leading storytelling platform." },
              { title: "Focus", text: "Culture, leadership, innovation, truth." },
              { title: "Impact", text: "Empowering voices through media." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false }}
                variants={i % 2 === 0 ? right : left}
                style={{ flex: 1, minWidth: 220 }}
              >
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#fff", color: "#111" }}>
                  <Typography sx={{ ...titleStyle, color: gold }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: "#555", fontSize: 14 }}>
                    {item.text}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Box>

          {/* STORY */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: false }} variants={up}>
            <Paper sx={{ mt: 4, p: 4, borderRadius: 4, bgcolor: "#fff", color: "#111" }}>
              <Typography sx={titleStyle} variant="h6">
                Founder’s Story
              </Typography>
              <Typography sx={{ color: "#555", lineHeight: 1.9 }}>
                Built from passion for storytelling and documenting real African experiences.
              </Typography>
            </Paper>
          </motion.div>

          {/* CONTACT */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: false }} variants={up}>
            <Paper sx={{ mt: 4, p: 4, borderRadius: 4, bgcolor: "#fff", color: "#111" }}>
              <Typography sx={titleStyle} variant="h6">
                Contact
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <EmailIcon sx={{ color: gold }} />
                  <Typography>realitylifemagazine@gmail.com</Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <PhoneIcon sx={{ color: gold }} />
                  <Typography>+234 706 612 2290</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth
                onClick={() => window.open(whatsappLink, "_blank")}
                sx={{ bgcolor: gold, color: "#000", fontWeight: 700 }}
              >
                Reach Out
              </Button>
            </Paper>
          </motion.div>

        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default ProfileScreen;