import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import ContentLoader from "../components/ContentLoader";
import { loadUpcomingEvents, type EventItem } from "../services/contentApi";

const gold = "#A67C1B";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
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
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const isSmallScreen = useMediaQuery("(max-width:899px)");
  const pageSize = isSmallScreen ? 10 : 20;

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

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((eventItem) =>
      `${eventItem.title} ${eventItem.description || eventItem.desc || ""}`.toLowerCase().includes(query)
    );
  }, [events, searchTerm]);

  const pageCount = Math.max(Math.ceil(filteredEvents.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [currentPage, filteredEvents, pageSize]);

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", py: 6 }}>
        <Container maxWidth="lg">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Typography
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: 800,
                textAlign: "center",
                mb: 1,
                letterSpacing: "-1px",
              }}
            >
              Upcoming Events
            </Typography>

            <Typography
              sx={{
                textAlign: "center",
                color: "#aaa",
                mb: 6,
                maxWidth: 650,
                mx: "auto",
              }}
            >
              Stay connected with Reality Life Magazine through our latest events, special gatherings, community
              stories, and important moments worth sharing.
            </Typography>
          </motion.div>

          {loading && (
            <ContentLoader
              title="Loading Upcoming Events"
              subtitle="Fetching the latest events from the backend."
            />
          )}

          {error && !loading && (
            <Paper
              elevation={0}
              sx={{
                maxWidth: 680,
                mx: "auto",
                mb: 4,
                p: 3,
                borderRadius: 2,
                bgcolor: "rgba(166,124,27,0.12)",
                border: "1px solid rgba(166,124,27,0.32)",
                color: "#f1d68a",
                textAlign: "center",
              }}
            >
              {error}. No upcoming events are available right now.
            </Paper>
          )}

          {!loading && !error && events.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                maxWidth: 680,
                mx: "auto",
                mb: 4,
                p: 3,
                borderRadius: 2,
                bgcolor: "#111",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ddd",
                textAlign: "center",
              }}
            >
              No upcoming events have been published yet.
            </Paper>
          )}

          {!loading && !error && events.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                bgcolor: "#111",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: 2,
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <TextField
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search events by title"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: gold }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  maxWidth: { xs: "100%", md: 460 },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: 2,
                  },
                }}
              />

              <Typography sx={{ color: "#c9c9c9", fontWeight: 700, textAlign: { xs: "left", md: "right" } }}>
                Showing {paginatedEvents.length} of {filteredEvents.length} events
              </Typography>
            </Paper>
          )}

          {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                maxWidth: 680,
                mx: "auto",
                mb: 4,
                p: 3,
                borderRadius: 2,
                bgcolor: "#111",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ddd",
                textAlign: "center",
              }}
            >
              No events match "{searchTerm}".
            </Paper>
          )}

          <Box
            sx={{
              display: loading || error ? "none" : "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
              gap: 3,
            }}
          >
            {paginatedEvents.map((eventItem, index) => {
              const eventId = eventItem._id || eventItem.id;
              const images = Array.isArray(eventItem.images) ? eventItem.images.filter(Boolean) : [];
              const primaryImage = images[0] || "";
              const secondaryImages = images.slice(1, 4);
              const remainingImages = Math.max(images.length - 4, 0);

              return (
                <motion.div
                  key={eventId || `${eventItem.title}-${currentPage}-${index}`}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: false }}
                  variants={fadeUp}
                  style={{ display: "flex" }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      width: "100%",
                      borderRadius: 5,
                      overflow: "hidden",
                      bgcolor: "#f7f7fa",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 8px 32px rgba(34,34,34,0.10)",
                      border: "1.5px solid #ececec",
                      transition: "0.3s",
                      minHeight: 420,
                      "&:hover": {
                        transform: "translateY(-10px) scale(1.03)",
                        boxShadow: `0 16px 40px ${gold}22`,
                        borderColor: gold,
                      },
                    }}
                  >
                    {primaryImage ? (
                      <Box sx={{ position: "relative", bgcolor: "#111" }}>
                        <Box
                          component="img"
                          src={primaryImage}
                          alt={eventItem.title}
                          sx={{
                            width: "100%",
                            height: { xs: "auto", sm: 190 },
                            objectFit: { xs: "contain", sm: "cover" },
                            display: "block",
                          }}
                        />

                        {secondaryImages.length > 0 && (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                              position: "absolute",
                              left: 12,
                              right: 12,
                              bottom: 12,
                              p: 0.75,
                              borderRadius: 2,
                              bgcolor: "rgba(10,10,10,0.72)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            {secondaryImages.map((eventImage, imageIndex) => (
                              <Box
                                key={`${eventImage}-${imageIndex}`}
                                sx={{
                                  position: "relative",
                                  width: 54,
                                  height: 44,
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  border: "1px solid rgba(255,255,255,0.55)",
                                  flexShrink: 0,
                                }}
                              >
                                <Box
                                  component="img"
                                  src={eventImage}
                                  alt={`${eventItem.title} image ${imageIndex + 2}`}
                                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                                {imageIndex === secondaryImages.length - 1 && remainingImages > 0 && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      inset: 0,
                                      display: "grid",
                                      placeItems: "center",
                                      bgcolor: "rgba(0,0,0,0.62)",
                                      color: "#fff",
                                      fontSize: 13,
                                      fontWeight: 900,
                                    }}
                                  >
                                    +{remainingImages}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        )}

                        {images.length > 1 && (
                          <Chip
                            size="small"
                            label={`${images.length} images`}
                            sx={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              bgcolor: "rgba(255,255,255,0.92)",
                              color: "#111",
                              fontWeight: 900,
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: 190,
                          bgcolor: "#111",
                          color: "#f1d68a",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                        }}
                      >
                        RealityLife
                      </Box>
                    )}

                    <Box sx={{ p: 3, display: "flex", flexDirection: "column", flex: 1 }}>
                      <Chip
                        label="Upcoming Event"
                        size="small"
                        sx={{
                          alignSelf: "flex-start",
                          mb: 1.5,
                          bgcolor: gold,
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />

                      <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 0.75 }}>
                        {eventItem.title}
                      </Typography>

                      <Typography sx={{ color: "#7a5c16", fontSize: 13, fontWeight: 800, mb: 1.25 }}>
                        {formatDate(eventItem.createdAt)}
                      </Typography>

                      <Typography sx={{ color: "#555", fontSize: 15, flex: 1 }}>
                        {eventItem.description || eventItem.desc}
                      </Typography>

                      <Button
                        component={RouterLink}
                        to={`/events/${eventId}`}
                        disabled={!eventId}
                        sx={{
                          mt: 2,
                          alignSelf: "flex-start",
                          color: gold,
                          fontWeight: 700,
                          textTransform: "none",
                          border: `1px solid ${gold}`,
                          "&:hover": {
                            bgcolor: gold,
                            color: "#fff",
                          },
                        }}
                      >
                        Read Article →
                      </Button>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>

          {!loading && !error && filteredEvents.length > pageSize && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={(_, value) => setPage(value)}
                color="primary"
                siblingCount={isSmallScreen ? 0 : 1}
                boundaryCount={1}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.24)",
                  },
                  "& .Mui-selected": {
                    bgcolor: `${gold} !important`,
                    color: "#fff",
                  },
                }}
              />
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default UpcomingEventsScreen;
