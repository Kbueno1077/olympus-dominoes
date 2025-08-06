"use client";

import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Button,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { PlayArrow, Group, EmojiEvents, BarChart } from "@mui/icons-material";
import { motion } from "framer-motion";

const NewGameCard = ({ onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: "pointer",
          background: "linear-gradient(135deg, #6366F115 0%, #6366F105 100%)",
          border: "1px solid #6366F120",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 32px #6366F130",
            border: "1px solid #6366F140",
          },
        }}
      >
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "20px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px #6366F140",
              }}
            >
              <PlayArrow sx={{ color: "white", fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Start New Game
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 400 }}
            >
              Set up your dominoes match with 2-4 players. Choose your game mode
              and start scoring!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              sx={{
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "white",
                fontWeight: "bold",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Start Game
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Dashboard({ onStartNewGame }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Stack
          spacing={3}
          alignItems="center"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            Welcome to Olympus
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ maxWidth: 600, lineHeight: 1.6 }}
          >
            The ultimate dominoes scoring experience. Track scores, manage
            players, and enjoy the game like never before.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            justifyContent="center"
          >
            <Chip
              icon={<Group />}
              label="2-4 Players"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<EmojiEvents />}
              label="Tournament Ready"
              color="secondary"
              variant="outlined"
            />
            <Chip
              icon={<BarChart />}
              label="Local Device Only"
              color="success"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </motion.div>

      {/* New Game Card */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box sx={{ maxWidth: 600, width: "100%" }}>
          <NewGameCard onClick={onStartNewGame} />
        </Box>
      </Box>
    </Container>
  );
}
