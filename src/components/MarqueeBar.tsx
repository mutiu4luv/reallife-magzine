import React from "react";
import { Box, Typography } from "@mui/material";

const MarqueeBar = () => {
  return (
    <Box
      sx={{
        height: "10vh",
        backgroundColor: "gold",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          animation: "marquee 18s linear infinite",
          "@keyframes marquee": {
            "0%": { transform: "translateX(0%)" },
            "100%": { transform: "translateX(-50%)" },
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", letterSpacing: "3px", px: 4 }}
        >
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
        </Typography>
      </Box>
    </Box>
  );
};

export default MarqueeBar;    