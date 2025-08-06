import {
  Box,
  Card,
  Chip,
  useMediaQuery,
  Typography,
  Stack,
} from "@mui/material";

import Iconify from "@/components/Iconify";
import { gameModeRecoil, playersAmountRecoil } from "@/recoil/recoilState";
import { useRecoilValue } from "recoil";
import { useTheme } from "@emotion/react";

export default function TableDraw() {
  const theme = useTheme();
  const matchesDownBreakpoint = useMediaQuery(theme.breakpoints.down("sm"));
  const gameMode = useRecoilValue(gameModeRecoil);
  const playersAmount = useRecoilValue(playersAmountRecoil);

  return (
    <>
      <Card
        sx={{
          p: 4,
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "1px solid rgba(99, 102, 241, 0.1)",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Table Layout
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Visual representation of player positions and dominoes
          </Typography>
        </Stack>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: "400px",
            margin: "0 auto",
            border: "2px solid #E2E8F0",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
            overflow: "hidden",
            "&::after": {
              content: '""',
              display: "block",
              paddingBottom: "100%",
            },
          }}
        >
          {/* Dominoes Icon */}
          <Iconify
            style={{
              position: "absolute",
              top: "32%",
              left: "32%",
              width: "36%",
              height: "36%",
              maxWidth: "120px",
              maxHeight: "120px",
              filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
            }}
            icon="arcticons:dominos"
          />

          {/* Team 1 - Bottom */}
          <Box
            style={{
              position: "absolute",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {!matchesDownBreakpoint && (
              <Box
                sx={{
                  display: "flex",
                  width: "120px",
                  height: "24px",
                  border: "2px solid #CBD5E1",
                  borderRadius: "12px",
                  background: "rgba(59, 130, 246, 0.1)",
                  overflow: "hidden",
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      borderRight: "1px solid #CBD5E1",
                      width: "12px",
                      background:
                        item % 2 === 0
                          ? "rgba(59, 130, 246, 0.2)"
                          : "transparent",
                    }}
                  />
                ))}
              </Box>
            )}
            <Chip
              label="Team 1"
              color="team1"
              sx={{
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            />
          </Box>

          {/* Team 2 - Right */}
          {playersAmount > 2 && (
            <Box
              style={{
                position: "absolute",
                display: "flex",
                gap: "8px",
                flexDirection: "column",
                bottom: "50%",
                right: "20px",
                transform: "translateY(50%)",
              }}
            >
              <Chip
                color="team2"
                label="Team 2"
                sx={{
                  fontWeight: "bold",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                }}
              />
              {!matchesDownBreakpoint && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "24px",
                    height: "120px",
                    border: "2px solid #CBD5E1",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    overflow: "hidden",
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        borderBottom: "1px solid #CBD5E1",
                        height: "12px",
                        background:
                          item % 2 === 0
                            ? "rgba(245, 158, 11, 0.2)"
                            : "transparent",
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Team 3 - Top */}
          <Box
            style={{
              position: "absolute",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {!matchesDownBreakpoint && (
              <Box
                sx={{
                  display: "flex",
                  width: "120px",
                  height: "24px",
                  border: "2px solid #CBD5E1",
                  borderRadius: "12px",
                  background:
                    gameMode?.label === "Free For All"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  overflow: "hidden",
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      borderRight: "1px solid #CBD5E1",
                      width: "12px",
                      background:
                        item % 2 === 0
                          ? gameMode?.label === "Free For All"
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(59, 130, 246, 0.2)"
                          : "transparent",
                    }}
                  />
                ))}
              </Box>
            )}
            <Chip
              color={gameMode?.label === "Free For All" ? "team3" : "team1"}
              label={gameMode?.label === "Free For All" ? "Team 3" : "Team 1"}
              sx={{
                fontWeight: "bold",
                boxShadow:
                  gameMode?.label === "Free For All"
                    ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                    : "0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            />
          </Box>

          {/* Team 4 - Left */}
          {playersAmount > 3 && (
            <Box
              style={{
                position: "absolute",
                top: "50%",
                left: "20px",
                gap: "8px",
                display: "flex",
                flexDirection: "column",
                transform: "translateY(-50%)",
              }}
            >
              {!matchesDownBreakpoint && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "24px",
                    height: "120px",
                    border: "2px solid #CBD5E1",
                    borderRadius: "12px",
                    background:
                      gameMode?.label === "Free For All"
                        ? "rgba(139, 92, 246, 0.1)"
                        : "rgba(245, 158, 11, 0.1)",
                    overflow: "hidden",
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        borderBottom: "1px solid #CBD5E1",
                        height: "12px",
                        background:
                          item % 2 === 0
                            ? gameMode?.label === "Free For All"
                              ? "rgba(139, 92, 246, 0.2)"
                              : "rgba(245, 158, 11, 0.2)"
                            : "transparent",
                      }}
                    />
                  ))}
                </Box>
              )}
              <Chip
                color={gameMode?.label === "Free For All" ? "team4" : "team2"}
                label={gameMode?.label === "Free For All" ? "Team 4" : "Team 2"}
                sx={{
                  fontWeight: "bold",
                  boxShadow:
                    gameMode?.label === "Free For All"
                      ? "0 2px 8px rgba(139, 92, 246, 0.3)"
                      : "0 2px 8px rgba(245, 158, 11, 0.3)",
                }}
              />
            </Box>
          )}
        </Box>
      </Card>
    </>
  );
}
