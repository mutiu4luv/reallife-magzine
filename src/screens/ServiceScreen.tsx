import {
    Box,
    Typography,
    Card,
    CardContent,
    Divider,
    Container,
  } from "@mui/material";
  import { motion } from "framer-motion";
  import Footer from "../components/Footer";
  
  const accent = "#A67C1B";
  
  const services = [
    {
      title: "Editorial & Storytelling Excellence",
      desc: "We craft compelling human stories that connect Africa to the world.",
      items: [
        "Feature writing, interviews, and investigative stories",
        "Culture, lifestyle, fashion, and society coverage",
        "Community-centered journalism",
        "Authentic African narratives with global relevance",
      ],
    },
    {
      title: "Digital Publishing & Content Distribution",
      desc: "We publish and distribute impactful stories across digital platforms.",
      items: [
        "Website article publishing and optimization",
        "Search-friendly content structuring",
        "Newsletter and subscriber content delivery",
        "Cross-platform content sharing strategy",
      ],
    },
    {
      title: "Brand Story & Media Visibility",
      desc: "We help brands and personalities tell their stories through media.",
      items: [
        "Sponsored stories and brand features",
        "Thought-leadership articles",
        "Public profile and reputation storytelling",
        "Audience engagement campaigns",
      ],
    },
    {
      title: "Interviews & Spotlight Features",
      desc: "We highlight changemakers, leaders, and rising voices.",
      items: [
        "Exclusive interviews with innovators",
        "Spotlight on entrepreneurs and creatives",
        "Community heroes and impact stories",
        "Youth and women empowerment features",
      ],
    },
    {
      title: "Multimedia & Visual Storytelling",
      desc: "We enhance stories with engaging visuals and media assets.",
      items: [
        "Photo stories and documentary visuals",
        "Video features and short documentaries",
        "Event coverage and highlights",
        "Creative storytelling formats",
      ],
    },
    {
      title: "Community & Social Impact Reporting",
      desc: "We document stories that drive awareness and positive change.",
      items: [
        "Grassroots impact stories",
        "Agriculture, wellness, and social development coverage",
        "Sports and community development reporting",
        "Voices from underserved communities",
      ],
    },
    {
      title: "Partnership & Collaboration Features",
      desc: "We collaborate with organizations to amplify meaningful work.",
      items: [
        "NGO and foundation storytelling partnerships",
        "Educational and advocacy content collaboration",
        "Event media partnership coverage",
        "Institutional story documentation",
      ],
    },
    {
      title: "Audience Engagement & Reader Experience",
      desc: "We design content that keeps readers informed and inspired.",
      items: [
        "Reader-focused editorial planning",
        "Interactive and relatable storytelling",
        "Content series and themed editions",
        "Community feedback and engagement loops",
      ],
    },
  ];
  
  const fadeUp = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0 },
  };
  
  const ServiceScreen = () => {
    const waterDataUri =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMDAnIGhlaWdodD0nNjAwJyB2aWV3Qm94PScwIDAgMjAwIDYwMCc+CiA8ZGVmcz4KICA8bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB4Mj0nMCcgeTE9JzAnIHkyPScxJz4KICAgIDxzdG9wIG9mZnNldD0nMCcgc3RvcC1jb2xvcj0nI2ZmZmZmZicgc3RvcC1vcGFjaXR5PScwLjQ1Jy8+CiAgICA8c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyNmZmZmZmYnIHN0b3Atb3BhY2l0eT0nMCcvPgogIDwvbGluZWFyR3JhZGllbnQ+CiA8L2RlZnM+CjxyZWN0IHg9JzEwJyB5PScwJyB3aWR0aD0nMTYnIGhlaWdodD0nNjAwJyBmaWxsPSd1cmwoI2cpJyBvcGFjaXR5PScwLjcnLz4KPC9zdmc+";
  
    return (
      <>
        {/* HERO */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            py: { xs: 7, md: 12 },
            textAlign: "center",
            background: `linear-gradient(135deg, #0b2545 0%, ${accent} 80%)`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("${waterDataUri}")`,
              backgroundRepeat: "repeat",
              opacity: 0.12,
              animation: "flow 12s linear infinite",
            }}
          />
  
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3.2rem" },
              }}
            >
              RealityLife Magazine Services
            </Typography>
  
            <Typography
              variant="h6"
              sx={{
                maxWidth: 750,
                mx: "auto",
                opacity: 0.9,
                px: 2,
              }}
            >
              Real stories. Real voices. Real impact across Africa and beyond.
            </Typography>
          </motion.div>
  
          <style>
            {`
              @keyframes flow {
                from { background-position: 0 0; }
                to { background-position: 0 100%; }
              }
            `}
          </style>
        </Box>
  
        {/* SERVICES (FLEXBOX GRID REPLACEMENT) */}
        <Container sx={{ py: { xs: 6, md: 10 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
            }}
          >
            {services.map((service, index) => (
              <Box
                key={index}
                sx={{
                  flex: "1 1 300px",
                  maxWidth: 360,
                  display: "flex",
                }}
              >
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  style={{ width: "100%" }}
                >
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      borderTop: `5px solid ${accent}`,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      transition: "0.3s",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "#0b2545", mb: 1 }}
                      >
                        {service.title}
                      </Typography>
  
                      <Divider sx={{ mb: 2, borderColor: accent }} />
  
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, color: "#4b5563" }}
                      >
                        {service.desc}
                      </Typography>
  
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {service.items.map((item, i) => (
                          <li key={i} style={{ marginBottom: 6, lineHeight: 1.5 }}>
                            {item}
                          </li>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Container>
  
        <Footer />
      </>
    );
  };
  
  export default ServiceScreen;