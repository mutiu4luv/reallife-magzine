import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { loadPastEditions, loadPosts } from "../services/contentApi";

type EditionImage = {
  src: string;
  alt: string;
};

const gold = "#A67C1B";

const getVisibleCount = () => {
  if (window.innerWidth < 600) {
    return 1;
  }

  if (window.innerWidth < 960) {
    return 2;
  }

  return 4;
};

const Pastedition: React.FC = () => {
  const [images, setImages] = useState<EditionImage[]>([]);
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        const [pastEditionResult, postResult] = await Promise.allSettled([loadPastEditions(), loadPosts()]);
        const pastEditions = pastEditionResult.status === "fulfilled" ? pastEditionResult.value : [];
        const posts = postResult.status === "fulfilled" ? postResult.value : [];

        const uploadedImages = pastEditions
          .filter((edition) => edition.image)
          .map((edition, index) => ({
            src: edition.image,
            alt: edition.title || `Past edition ${index + 1}`,
          }));

        const postImages = posts.filter((post) => post.type !== "Book").flatMap((post, postIndex) => {
          const postImages = post.images?.length ? post.images : post.image ? [post.image] : [];

          return postImages
            .filter(Boolean)
            .map((src, imageIndex) => ({
              src,
              alt: post.title ? `${post.title} edition ${imageIndex + 1}` : `Past edition ${postIndex + 1}`,
            }));
        });

        const nextImages = [...uploadedImages, ...postImages];

        if (isMounted) {
          setImages(nextImages);
        }
      } catch {
        if (isMounted) {
          setImages([]);
        }
      } finally {
        if (isMounted) {
          setHasFetched(true);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = useMemo(() => Math.max(images.length - visibleCount, 0), [images.length, visibleCount]);

  useEffect(() => {
    setCurrent((value) => Math.min(value, maxIndex));
  }, [maxIndex]);

  const next = useCallback(() => {
    setCurrent((value) => (value >= maxIndex ? 0 : value + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((value) => (value <= 0 ? maxIndex : value - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (images.length <= visibleCount) {
      return undefined;
    }

    const intervalId = window.setInterval(next, 3000);
    return () => window.clearInterval(intervalId);
  }, [images.length, next, visibleCount]);

  if (!hasFetched || images.length === 0) {
    return null;
  }

  const showControls = images.length > visibleCount;

  return (
    <Box
      component="section"
      sx={{
        bgcolor: "#050505",
        py: { xs: 3, sm: 4 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          px: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: "#fff",
            fontWeight: 900,
            fontSize: { xs: 28, sm: 36, md: 44 },
            letterSpacing: "-0.8px",
            position: "relative",
            display: "inline-block",
            pb: 1.5,
            "&::after": {
              content: '""',
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 3,
              width: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
              backgroundSize: "200% 100%",
              animation: "pastEditionLineMove 1.8s linear infinite",
            },
            "@keyframes pastEditionLineMove": {
              "0%": {
                backgroundPosition: "200% 0",
              },
              "100%": {
                backgroundPosition: "-200% 0",
              },
            },
          }}
        >
          Our Past Editions
        </Typography>

        <Typography
          sx={{
            color: "#bdbdbd",
            maxWidth: 720,
            mx: "auto",
            mt: 2,
            fontSize: { xs: 14.5, sm: 16 },
            lineHeight: 1.8,
            textAlign: "left",
          }}
        >
          Take a look  at  past editions of Reality Life Magazine, capturing Moments, inspiring stories,
          memorable features and the voices that shape our society. At Reality Life Magazine, we celebrate culture, We document histories/events, for a lasting memories. Your legacies lives on...
        </Typography>
      </Box>

      <Box sx={{ position: "relative", width: "100%", mx: "auto" }}>
        <Box
          sx={{
            width: "100%",
            height: { xs: 360, sm: 460, md: 560 },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              transform: `translateX(-${current * (100 / visibleCount)}%)`,
              transition: "transform 0.65s ease",
            }}
          >
            {images.map((image, index) => (
              <Box
                key={`${image.src}-${index}`}
                sx={{
                  flex: `0 0 ${100 / visibleCount}%`,
                  height: "100%",
                  px: { xs: 0.5, sm: 0.75 },
                  boxSizing: "border-box",
                }}
              >
                <Box
                  component="img"
                  src={image.src}
                  alt={image.alt}
                  loading={index < visibleCount ? "eager" : "lazy"}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    bgcolor: "#050505",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {showControls && (
          <>
            <IconButton
              onClick={prev}
              aria-label="Previous past edition"
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: 8, md: 20 },
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.52)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                "&:hover": { bgcolor: "rgba(166,124,27,0.9)" },
              }}
            >
              <KeyboardArrowLeftIcon />
            </IconButton>

            <IconButton
              onClick={next}
              aria-label="Next past edition"
              sx={{
                position: "absolute",
                top: "50%",
                right: { xs: 8, md: 20 },
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.52)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                "&:hover": { bgcolor: "rgba(166,124,27,0.9)" },
              }}
            >
              <KeyboardArrowRightIcon />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Pastedition;
