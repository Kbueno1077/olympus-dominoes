"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { ExpandMore } from "@mui/icons-material";
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";

export default function LanguageSwitch({ dense = false }) {
  const { t, language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const current =
    LANGUAGES.find((entry) => entry.code === language) ?? LANGUAGES[0];

  return (
    <>
      <Button
        size="small"
        color="inherit"
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : undefined}
        aria-controls={open ? "language-menu" : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={
          dense ? undefined : <ExpandMore sx={{ fontSize: 18 }} />
        }
        sx={{
          minWidth: 0,
          minHeight: dense ? 28 : undefined,
          flexShrink: 0,
          px: dense ? 0.55 : { xs: 0.75, sm: 1 },
          py: dense ? 0.15 : 0.5,
          color: "text.secondary",
          fontWeight: 600,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: dense ? 1 : 1.5,
          "&:hover": {
            backgroundColor: (theme) =>
              alpha(theme.palette.primary.main, 0.06),
            borderColor: (theme) =>
              alpha(theme.palette.primary.main, 0.28),
          },
          "& .MuiButton-endIcon": {
            display: { xs: "none", sm: "inherit" },
            ml: 0.5,
          },
        }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{
            fontSize: dense ? 14 : 16,
            lineHeight: 1,
            mr: dense ? 0 : { xs: 0, sm: 0.75 },
          }}
        >
          {current.flag}
        </Box>
        <Box
          component="span"
          sx={{ display: dense ? "none" : { xs: "none", sm: "inline" } }}
        >
          {current.short}
        </Box>
      </Button>

      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { mt: 1, minWidth: 168 },
          },
        }}
      >
        {LANGUAGES.map((entry) => (
          <MenuItem
            key={entry.code}
            selected={entry.code === language}
            onClick={() => {
              setLanguage(entry.code);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, fontSize: 18 }}>
              <Box component="span" aria-hidden>
                {entry.flag}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={entry.name}
              secondary={entry.region}
              primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
