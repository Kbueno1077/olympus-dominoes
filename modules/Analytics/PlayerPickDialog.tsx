"use client";

import { useTranslation } from "@/i18n/useTranslation";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

export type PlayerPickRow = {
  id: number;
  name: string;
  is_myself?: number | boolean | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  players: PlayerPickRow[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** When true, names not already picked cannot be checked (Compare cap). */
  disableUnselected?: boolean;
};

function nameMatches(name: string, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return name.toLocaleLowerCase().includes(needle);
}

export default function PlayerPickDialog({
  open,
  onClose,
  players,
  selectedIds,
  onToggle,
  disableUnselected = false,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const visible = useMemo(() => {
    return players.filter((player) => nameMatches(player.name, query));
  }, [players, query]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
      PaperProps={{
        sx: {
          maxHeight: "min(640px, calc(100dvh - 32px))",
        },
      }}
    >
      <DialogTitle component="div">
        {t("statsComparePick")}
        <TextField
          size="small"
          fullWidth
          autoFocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("statsCompareSearch")}
          inputProps={{ "aria-label": t("statsCompareSearch") }}
          sx={{ mt: 1.5, fontWeight: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined
                  sx={{ fontSize: 20, color: "text.secondary" }}
                />
              </InputAdornment>
            ),
          }}
        />
      </DialogTitle>
      <DialogContent dividers sx={{ py: 0.5, minHeight: 0 }}>
        {visible.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", py: 2 }}
          >
            {t("statsCompareNoMatch")}
          </Typography>
        ) : (
          <Stack>
            {visible.map((player) => {
              const checked = selectedIds.includes(player.id);
              return (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      checked={checked}
                      disabled={disableUnselected && !checked}
                      onChange={() => onToggle(player.id)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{player.name}</span>
                      {player.is_myself ? (
                        <Typography
                          variant="overline"
                          sx={{ color: "primary.main", fontSize: 10 }}
                        >
                          {t("youBadge")}
                        </Typography>
                      ) : null}
                    </Stack>
                  }
                />
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t("done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
