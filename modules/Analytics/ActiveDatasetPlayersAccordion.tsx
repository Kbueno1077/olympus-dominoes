"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { PlayerRow } from "@/lib/analytics/types";
import { useTranslation } from "@/i18n/useTranslation";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";

function sortPlayers(players: PlayerRow[]) {
  return players.slice().sort((a, b) => {
    const aSelf = Boolean(a.is_myself) ? 0 : 1;
    const bSelf = Boolean(b.is_myself) ? 0 : 1;
    if (aSelf !== bSelf) return aSelf - bSelf;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Bottom of Manage data: roster for the active save, with You-badge controls.
 */
export default function ActiveDatasetPlayersAccordion() {
  const { t } = useTranslation();
  const { data, setMyselfPlayer, clearMyselfPlayer } = useAnalytics();

  const players = useMemo(
    () => (data ? sortPlayers(data.players) : []),
    [data]
  );

  if (!data) return null;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        flexShrink: 0,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.9),
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2.5,
          minHeight: 52,
          "& .MuiAccordionSummary-content": { my: 1 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("datasetsPlayersTitle")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("datasetsPlayersCount", { n: players.length })}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: 2.5,
          pt: 0,
          pb: { xs: 3, sm: 2 },
          maxHeight: { xs: "42vh", sm: 280 },
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 1.25 }}
        >
          {t("datasetsPlayersHint")}
        </Typography>

        {players.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("datasetsPlayersEmpty")}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {players.map((player) => {
              const isMyself = Boolean(player.is_myself);
              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 0.85,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: isMyself
                      ? (theme) => alpha(theme.palette.primary.main, 0.35)
                      : "divider",
                    backgroundColor: isMyself
                      ? (theme) => alpha(theme.palette.primary.main, 0.06)
                      : (theme) => alpha(theme.palette.common.white, 0.5),
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        noWrap
                        sx={{ fontWeight: 600, minWidth: 0 }}
                      >
                        {player.name}
                      </Typography>
                      {isMyself ? (
                        <Typography
                          variant="overline"
                          sx={{
                            color: "primary.main",
                            fontSize: 10,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          {t("youBadge")}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                  {isMyself ? (
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => clearMyselfPlayer()}
                      sx={{ flexShrink: 0, color: "text.secondary" }}
                    >
                      {t("clearMyself")}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => setMyselfPlayer(player.id)}
                      sx={{ flexShrink: 0 }}
                    >
                      {t("setAsMyself")}
                    </Button>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
