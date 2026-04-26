import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { EventAvailable } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const EVENT_ENDPOINTS = [`${API_BASE_URL}/api/upcoming-events`, `${API_BASE_URL}/api/events`];

type UpcomingEvent = {
  _id?: string;
  title: string;
  isActive: boolean;
  createdAt?: string;
};

const normalizeCollection = (payload: unknown): UpcomingEvent[] => {
  if (Array.isArray(payload)) {
    return payload as UpcomingEvent[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as UpcomingEvent[]) : [];
  }

  return [];
};

const loadUpcomingEvents = async () => {
  for (const endpoint of EVENT_ENDPOINTS) {
    try {
      const response = await fetch(endpoint);

      if (response.status === 404 && endpoint !== EVENT_ENDPOINTS[EVENT_ENDPOINTS.length - 1]) {
        continue;
      }

      if (!response.ok) {
        return [];
      }

      return normalizeCollection(await response.json());
    } catch {
      if (endpoint === EVENT_ENDPOINTS[EVENT_ENDPOINTS.length - 1]) {
        return [];
      }
    }
  }

  return [];
};

const UpcomingEventNotice = () => {
  const location = useLocation();
  const [event, setEvent] = useState<UpcomingEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      return;
    }

    let isMounted = true;

    const showNotice = async () => {
      const events = await loadUpcomingEvents();
      const activeEvent = events.find((eventItem) => eventItem.isActive);

      if (isMounted && activeEvent) {
        setEvent(activeEvent);
        setIsOpen(true);
      }
    };

    showNotice();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (!event) {
    return null;
  }

  return (
    <Dialog open={isOpen} fullWidth maxWidth="sm" aria-labelledby="upcoming-event-title">
      <Box
        sx={{
          bgcolor: "#111318",
          color: "#fff",
          px: { xs: 2.5, sm: 3 },
          pt: 3,
          pb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: "#caa64a",
            color: "#111318",
            display: "grid",
            placeItems: "center",
            mb: 2,
          }}
        >
          <EventAvailable />
        </Box>
        <Chip
          label="Upcoming Event"
          size="small"
          sx={{ bgcolor: "#f7edd0", color: "#6f5517", fontWeight: 900, mb: 1.5 }}
        />
        <DialogTitle id="upcoming-event-title" sx={{ p: 0, fontWeight: 900, fontSize: { xs: 26, sm: 32 } }}>
          {event.title}
        </DialogTitle>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5 }}>
        <Typography sx={{ color: "#475467", fontSize: 16 }}>
          RealityLife has an active upcoming event. Please take note before continuing through the site.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Button
          onClick={() => setIsOpen(false)}
          autoFocus
          sx={{
            bgcolor: "#111318",
            color: "#fff",
            textTransform: "none",
            fontWeight: 900,
            px: 3,
            "&:hover": { bgcolor: "#2a2f38" },
          }}
        >
          Continue to site
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpcomingEventNotice;
