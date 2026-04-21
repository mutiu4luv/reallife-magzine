import React from "react";
import { Box } from "@mui/material";

const MarqueeBar: React.FC = () => {
  return (
    <Box
      sx={{
        height: "8vh",
        backgroundColor: "gold",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <marquee behavior="scroll" direction="left" scrollamount="8">
        <strong style={{ fontSize: "1.5rem", letterSpacing: "2px" }}>
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
          REAL LIFE MAGAZINE • REAL LIFE MAGAZINE •
        </strong>
      </marquee>
    </Box>
  );
};

export default MarqueeBar;