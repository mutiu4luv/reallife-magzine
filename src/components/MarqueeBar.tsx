import { Box, Typography } from "@mui/material";

const MarqueeBar: React.FC = () => {
  const text =
    "REALLITYLIFE MAGAZINE • REALLITYLIFE MAGAZINE • REALLITYLIFE MAGAZINE • ";

  return (
    <Box
      sx={{
        minHeight: { xs: 52, md: 68 },
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
          sx={{ fontWeight: "bold", letterSpacing: { xs: "1px", md: "3px" }, px: { xs: 2, md: 4 }, fontSize: { xs: 13, sm: 15, md: 16 } }}
        >
          {text}
        </Typography>

        {/* Second copy (required for seamless loop) */}
        <Typography
          sx={{ fontWeight: "bold", letterSpacing: { xs: "1px", md: "3px" }, px: { xs: 2, md: 4 }, fontSize: { xs: 13, sm: 15, md: 16 } }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

export default MarqueeBar;
