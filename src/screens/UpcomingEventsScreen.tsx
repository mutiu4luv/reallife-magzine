import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  ImageList,
  ImageListItem,
  Paper,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { loadUpcomingEvents, type EventItem } from "../services/contentApi";

const gold = "#caa64a";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Upcoming";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const UpcomingEventsScreen: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const items = await loadUpcomingEvents();
        if (mounted) {
          setEvents(items);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load upcoming events.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredEvent = events[0];
  const eventList = useMemo(() => events.slice(featuredEvent ? 1 : 0), [events, featuredEvent]);

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f4f1ea", color: "#111318", pb: { xs: 6, md: 9 } }}>
        <Box sx={{ bgcolor: "#111318", color: "#fff", pt: { xs: 6, md: 8 }, pb: { xs: 5, md: 7 } }}>
          <Container maxWidth="lg">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <Chip label="Upcoming Events" sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900, mb: 2 }} />
              <Typography sx={{ fontSize: { xs: 38, md: 64 }, lineHeight: 1, fontWeight: 950, maxWidth: 820 }}>
                Gatherings, launches, and moments worth showing up for.
              </Typography>
              <Typography sx={{ color: "#d7d9de", mt: 2, maxWidth: 700, fontSize: { xs: 16, md: 18 }, lineHeight: 1.7 }}>
                Browse RealityLife event announcements with images, details, and active community updates.
              </Typography>
            </motion.div>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: { xs: -3, md: -5 } }}>
          {loading && (
            <Paper elevation={0} sx={{ minHeight: 260, display: "grid", placeItems: "center", borderRadius: 2 }}>
              <CircularProgress sx={{ color: gold }} />
            </Paper>
          )}

          {!loading && error && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff7e6", color: "#6f5517" }}>
              {error}. No upcoming events are available right now.
            </Paper>
          )}

          {!loading && !error && events.length === 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff", color: "#475467" }}>
              No upcoming events have been published yet.
            </Paper>
          )}

          {!loading && !error && featuredEvent && (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" },
                  border: "1px solid #e7dfd1",
                  boxShadow: "0 18px 60px rgba(17,19,24,0.12)",
                }}
              >
                <Box sx={{ minHeight: { xs: 320, md: 520 }, bgcolor: "#111318" }}>
                  <ImageList cols={featuredEvent.images.length > 1 ? 2 : 1} gap={8} sx={{ m: 0, height: "100%" }}>
                    {featuredEvent.images.slice(0, 4).map((image, index) => (
                      <ImageListItem key={`${image}-${index}`} sx={{ height: "100% !important" }}>
                        <Box component="img" src={image} alt={`${featuredEvent.title} ${index + 1}`} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
                <Box sx={{ p: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Chip label={featuredEvent.isActive ? "Active event" : formatDate(featuredEvent.createdAt)} sx={{ alignSelf: "flex-start", bgcolor: "#111318", color: "#fff", fontWeight: 900, mb: 2 }} />
                  <Typography sx={{ fontWeight: 950, fontSize: { xs: 30, md: 46 }, lineHeight: 1.05 }}>
                    {featuredEvent.title}
                  </Typography>
                  <Typography sx={{ mt: 2, color: "#566070", lineHeight: 1.8, fontSize: 16 }}>
                    {featuredEvent.description}
                  </Typography>
                </Box>
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
                {eventList.map((eventItem, index) => (
                  <motion.div key={eventItem._id || eventItem.id || `${eventItem.title}-${index}`} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                    <Paper elevation={0} sx={{ height: "100%", borderRadius: 2, overflow: "hidden", bgcolor: "#fff", border: "1px solid #e7dfd1" }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", height: 170, bgcolor: "#111318" }}>
                        {eventItem.images.slice(0, 3).map((image, imageIndex) => (
                          <Box key={`${image}-${imageIndex}`} component="img" src={image} alt={`${eventItem.title} ${imageIndex + 1}`} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ))}
                      </Box>
                      <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ color: "#6f5517", fontSize: 13, fontWeight: 900, mb: 1 }}>
                          {eventItem.isActive ? "Active event" : formatDate(eventItem.createdAt)}
                        </Typography>
                        <Typography sx={{ fontWeight: 950, fontSize: 24, lineHeight: 1.1 }}>
                          {eventItem.title}
                        </Typography>
                        <Typography sx={{ color: "#566070", mt: 1.5, lineHeight: 1.7 }}>
                          {eventItem.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default UpcomingEventsScreen;
