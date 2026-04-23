import { Box, Typography } from "@mui/material";

const MarqueeBar: React.FC = () => {
  const text =
    "REALLITYLIFE MAGAZINE • REALLITYLIFE MAGAZINE • REALLITYLIFE MAGAZINE • ";

  return (
    <Box
      sx={{
        height: "10vh",
        bgcolor: "#A67C1B",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          whiteSpace: "nowrap",
          animation: "marquee 20s linear infinite",
          "@keyframes marquee": {
            "0%": { transform: "translateX(0%)" },
            "100%": { transform: "translateX(-50%)" },
          },
        }}
      >
        {/* First copy */}
        <Typography
          sx={{ fontWeight: "bold", letterSpacing: "3px", px: 4 }}
        >
          {text}
        </Typography>

        {/* Second copy (required for seamless loop) */}
        <Typography
          sx={{ fontWeight: "bold", letterSpacing: "3px", px: 4 }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

export default MarqueeBar;