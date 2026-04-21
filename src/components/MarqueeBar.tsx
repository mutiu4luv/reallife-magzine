import { Box, Typography } from "@mui/material";

const MarqueeBar: React.FC = () => {
  return (
    <Box
      sx={{
        height: "10vh",
        bgcolor: "gold",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          whiteSpace: "nowrap",
          animation: "marquee 18s linear infinite",
          "@keyframes marquee": {
            from: { transform: "translateX(100%)" },
            to: { transform: "translateX(-100%)" },
          },
        }}
      >
        <Typography sx={{ fontWeight: "bold", letterSpacing: "3px", px: 4 }}>
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE
        </Typography>
      </Box>
    </Box>
  );
};

export default MarqueeBar;