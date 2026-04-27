import React, { useMemo, useState } from "react";
import { Box, Typography, Card, CardContent, Button, Container } from "@mui/material";
import { motion } from "framer-motion";

import i1 from "../assets/interview1.jpeg";
import i2 from "../assets/interview2.jpeg";
import i3 from "../assets/interview3.jpeg";
import i4 from "../assets/interview4.jpeg";
import i5 from "../assets/interview5.jpeg";

const gold = "#A67C1B";

// Add Q&A structure for interviews
type QA = { question: string; answer: string };
type Interview = {
  name: string;
  role: string;
  image: string;
  message?: string;
  qa: QA[];
};

const interviews: Interview[] = [
  {
    name: "MRS OLUKEMI MIMIKO",
    role: "Former Governor's Wife",
    image: i1,
    qa: [
      {
        question: "Your programmes are all human face, what really motivates you, sir?",
        answer:
          "Well, I believe even before I got here that governance should be about the people. Like I always say, all resources at the disposal of the government belong to the people. It is the people that elect whoever into positions of authority; those that are elected are mere executive servants or just caretakers, who take care of the properties of the one that appointed him or her.",
      },
      {
        question: "How did you handle the economic situation as a governor?",
        answer:
          "It is a terrible and harrowing experience to find it difficult to pay workers at the end of the month. However, I express hope that the state will eventually get out of the current economic situation.",
      },
    ],
  },
  {
    name: "CHIEF MICHAEL ADE. OJO",
    role: "Founder, Elizade Motors",
    image: i2, // Ensure this is the correct image for the Chief
    // intro: "At 80, Chief Michael Ade. Ojo can best be described as a man that has seen it all. From a very humble beginning patched with the vicissitudes of life, to an obvious fulfilled life of affluence and influence, he is a study in perseverance, determination, and entrepreneurship.",
    qa: [
      {
        question: "Chief, you've reached the milestone of 80 years. Looking back, why do you say working hard was simply a 'norm' for you?",
        answer: "I grew up to see working hard as a norm. My early days in Ilara-Mokin were patched with the vicissitudes of life, but it was there I learned that resources belong to God and we are merely caretakers. This journey from a humble background to affluence was built on honesty and the determination to impact humanity."
      },
      {
        question: "How has your journey as the 'Aremo Kunrin' of Ilara-Mokin influenced your philanthropy?",
        answer: "Going down memory lane, my venture into business and the wealth that followed was never for me alone. It was a blessing to impact my town, Ilara-Mokin, and Nigeria at large. Honesty in business is not just a policy; it is a way of life that provokes real success."
      }
    ]
  },
  {
    name: "GOV. LUCKY AIYEDATIWA",
    role: "Executive Governor of Ondo State",
    image: i3, // Replace with the actual image variable for the Governor
    // intro: "Hon. Lucky Orimisan Aiyedatiwa is a distinguished statesman and accomplished businessman. From his roots in the oil-bearing community of Obe-Nla to the highest office in the Sunshine State, his journey is a testament to the power of education and purposeful leadership.",
    qa: [
      {
        question: "Your Excellency, your journey began in Obe-Nla, Ilaje LGA. How did your early education and upbringing in an oil-bearing community shape your perspective on governance?",
        answer: "My educational journey from Saint Peter's UNA Primary School to Ikosi High School provided a solid foundation. Growing up in Obe-Nla gave me firsthand insight into the needs of our people. I believe that my transition from the classroom to the world of business and eventually governance was driven by a passion for service and a deep-seated commitment to the development of Ondo State."
      },
      {
        question: "Having earned an NCE in Economics and Government, how do you apply these academic principles to the economic transformation of the Sunshine State?",
        answer: "Education is the bedrock of progress. My background in Economics has been instrumental in managing the resources of our state effectively. We are focused on creating an environment where business can thrive, ensuring that Ondo State remains a 'Shining Gem' of progress, innovation, and prosperity for all."
      }
    ],
  },
  {
    name: "OBA DR. VICTOR KILADEJO",
    role: "Osemawe & Paramount Ruler of Ondo Kingdom",
    image: i4, // Replace with the actual image variable for the Osemawe
    // intro: "Oba Dr. Victor Adesimbo Ademefun Kiladejo, CFR, Jilo III, is a monarch whose reign is described as a 'Divine Blessing.' Celebrating 70 years of life and 17 years on the throne, his leadership has transformed the Ondo Kingdom through immeasurable developmental strides in health, education, and infrastructure.",
    qa: [
      {
        question: "Your Imperial Majesty, you often say you became Kabiyesi by 'Divine Providence.' Looking back at your 17 years on the throne, how has that spiritual conviction guided your leadership?",
        answer: "Ascending the throne of my forefathers was never about personal ambition; it was a call from the Almighty. This conviction has been my compass. It has driven me to ensure that every year spent on this throne translates into a blessing for the Ondo Kingdom, fostering an era where peace and progress walk hand-in-hand."
      },
      {
        question: "Your reign has seen a massive expansion in health and human capacity building. What is your ultimate vision for the modern Ondo Kingdom?",
        answer: "My vision has always been to leave the Kingdom better than I found it. By focusing on social infrastructure and health, we are building a foundation for future generations. I want the Ondo Kingdom to be a study in how traditional institutions can partner with modern developmental goals to create a prosperous society for every son and daughter of the soil."
      }
    ],
  },
  {
    name: "OONI ADEYEYE OGUNWUSI",
    role: "Ojaja II, The 51st Ooni of Ife",
    image: i5, // Replace with your Ooni image variable
    // intro: "His Imperial Majesty, Ooni Adeyeye Enitan Babatunde Ogunwusi, Ojaja II, is a monarch of purpose. In this rare reflection, he delves into his humble beginnings in Ibadan and discusses the unique divine favor of being an Ooni with a living father—a phenomenon unseen in the Ife lineage for nearly 800 years.",
    qa: [
      {
        question: "Kabiyesi, reflecting on your upbringing in Ibadan, how did the influence of your parents and the unique presence of your father and grandfather shape the man who would become the 51st Ooni of Ife?",
        answer: "I come from a humble background, and I credit my late mother for shaping who I am today. I am also eternally grateful to God for blessing me with a father, which is exceptionally rare for our lineage—it has been nearly 800 years since an Ooni had both a father and grandfather present. Growing up, I was always curious and eager to explore, fueled by a strong sense of purpose and inspired by my father’s legacy and his influential connections."
      },
      {
        question: "You have made a solemn vow to serve humanity. How does this promise define your current reign and your vision for the future of the Yoruba race?",
        answer: "For the rest of my life on this throne, I will serve humanity and be impactful in everything I do. My childhood curiosity has evolved into a quest for communal growth. I see my position not just as a title of royalty, but as a platform to uplift people, foster unity, and ensure that the heritage of our forefathers remains a living, breathing source of inspiration for Nigeria and the world."
      }
    ],
  },
];

const shuffleArray = (array: Interview[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const InterviewSection: React.FC = () => {
  const randomThree = useMemo(
    () => shuffleArray(interviews).slice(0, 3),
    []
  );
  const [openIndexes, setOpenIndexes] = useState<{ [key: number]: boolean }>({});

  const handleToggle = (idx: number) => {
    setOpenIndexes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        px: { xs: 2, sm: 3 },
        textAlign: "center",
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg" disableGutters>
      {/* Heading */}
      <Box sx={{ display: "inline-block", mb: { xs: 4, md: 6 }, maxWidth: "100%" }}>
        <Typography
          sx={{
            fontWeight: 900,
            color: gold,
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: { xs: "1.55rem", sm: "1.9rem", md: "2.2rem" },
            lineHeight: 1.15,
            mb: 1,
          }}
        >
          Exclusive Interviews
        </Typography>

        <Typography
          sx={{
            maxWidth: 700,
            mx: "auto",
            color: "#444",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
          }}
        >
          Real conversations with inspiring individuals shaping culture,
          business, creativity, and innovation across different industries.
        </Typography>

        <Box
          sx={{
            width: "100%",
            height: "4px",
            bgcolor: "rgba(166,124,27,0.15)",
            borderRadius: "2px",
            mt: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              height: "100%",
              background: gold,
              borderRadius: "2px",
            }}
          />
        </Box>
      </Box>

      {/* Cards */}
      <Box
  sx={{
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
    justifyContent: "center",
    gap: { xs: 3, md: 4 },
  }}
>
  {randomThree.map((item, index) => {
    const expanded = openIndexes[index];
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.2 }}
        style={{
          width: "100%",
          minWidth: 0,
          display: "flex",
        }}
      >
        <Card
          sx={{
            width: "100%",
            borderRadius: 2,
            backgroundColor: "#111",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "0.3s",
            minHeight: { xs: "auto", md: 600 },
            "&:hover": {
              transform: "translateY(-10px)",
              boxShadow: `0 10px 25px rgba(166,124,27,0.25)`,
            },
          }}
        >
          <Box
            component="img"
            src={item.image}
            alt={item.name}
            sx={{
              width: "100%",
              height: { xs: 320, sm: 360, md: 400, lg: 420 },
              objectFit: "cover",
            }}
          />

          <CardContent sx={{ textAlign: "left", flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: gold,
                fontSize: "1.1rem",
                overflowWrap: "anywhere",
              }}
            >
              {item.name}
            </Typography>

            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#aaa",
                mb: 2,
              }}
            >
              {item.role}
            </Typography>

            {/* Q&A format */}
            {item.qa.slice(0, expanded ? item.qa.length : 1).map((qa, qidx) => (
              <Box key={qidx} sx={{ mb: 2 }}>
                <Typography sx={{ color: gold, fontWeight: 600, fontSize: "0.98rem", overflowWrap: "anywhere" }}>
                  Q: {qa.question}
                </Typography>
                <Typography sx={{ color: "#ddd", fontSize: "0.93rem", lineHeight: 1.6, fontStyle: "italic", mt: 0.5, overflowWrap: "anywhere" }}>
                  A: {qa.answer}
                </Typography>
              </Box>
            ))}

            <Button
              size="small"
              sx={{
                mt: 2,
                color: gold,
                textTransform: "none",
                fontWeight: 600,
                p: 0,
              }}
              onClick={() => handleToggle(index)}
            >
              {expanded ? "Show less" : "Read full interview"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  })}
</Box>
      </Container>
    </Box>
  );
};

export default InterviewSection;
