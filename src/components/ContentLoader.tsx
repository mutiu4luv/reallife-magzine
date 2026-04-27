import { Box, CircularProgress, Paper, Typography } from "@mui/material";

const gold = "#A67C1B";

type ContentLoaderProps = {
  title: string;
  subtitle: string;
};

const ContentLoader = ({ title, subtitle }: ContentLoaderProps) => (
  <Paper
    elevation={0}
    sx={{
      position: "relative",
      overflow: "hidden",
      maxWidth: 560,
      mx: "auto",
      my: { xs: 4, md: 6 },
      p: { xs: 4, sm: 5 },
      borderRadius: 2,
      bgcolor: "#111",
      border: "1px solid rgba(166,124,27,0.34)",
      color: "#fff",
      textAlign: "center",
      isolation: "isolate",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: -120,
        background:
          "radial-gradient(circle at 25% 20%, rgba(166,124,27,0.38), transparent 32%), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.12), transparent 28%)",
        animation: "contentLoaderGlow 4.8s ease-in-out infinite alternate",
        zIndex: -1,
      },
      "@keyframes contentLoaderGlow": {
        "0%": { transform: "translate3d(-2%, -2%, 0) scale(1)" },
        "100%": { transform: "translate3d(2%, 2%, 0) scale(1.08)" },
      },
      "@keyframes contentLoaderBar": {
        "0%, 100%": { opacity: 0.35, transform: "scaleX(0.55)" },
        "50%": { opacity: 1, transform: "scaleX(1)" },
      },
    }}
  >
    <Box sx={{ position: "relative", width: 104, height: 104, mx: "auto", mb: 3, display: "grid", placeItems: "center" }}>
      <CircularProgress size={104} thickness={2.5} sx={{ position: "absolute", color: gold }} />
      <CircularProgress
        size={74}
        thickness={2.1}
        variant="determinate"
        value={68}
        sx={{ position: "absolute", color: "rgba(255,255,255,0.22)", transform: "rotate(130deg)" }}
      />
      <Typography sx={{ color: gold, fontWeight: 900, fontSize: 24 }}>RL</Typography>
    </Box>

    <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15 }}>
      {title}
    </Typography>
    <Typography sx={{ color: "#c9c9c9", mt: 1, mb: 3 }}>{subtitle}</Typography>

    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }} aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <Box
          key={item}
          sx={{
            width: 42,
            height: 4,
            borderRadius: 999,
            bgcolor: item === 1 ? gold : "rgba(255,255,255,0.34)",
            transformOrigin: "center",
            animation: `contentLoaderBar 1.15s ease-in-out ${item * 0.16}s infinite`,
          }}
        />
      ))}
    </Box>
  </Paper>
);

export default ContentLoader;
