"use client";

import Close from "@mui/icons-material/Close";
import OpenInFull from "@mui/icons-material/OpenInFull";
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { createContext, useContext, useState, type ReactNode } from "react";

const LabChartExpandedContext = createContext(false);

/** True when this chart is the full-screen copy, false in the card. */
export function useLabChartExpanded(): boolean {
  return useContext(LabChartExpandedContext);
}

export function LabExpandable({
  title,
  hint,
  header,
  actions,
  children,
  kind,
  tile = false,
}: {
  title: string;
  hint?: string;
  header?: ReactNode;
  /** Icon buttons sitting just left of expand and of close. Called twice. */
  actions?: () => ReactNode;
  children: ReactNode;
  kind: "chart" | "table";
  /** Stretch to the grid cell so the tile lines up with neighboring charts. */
  tile?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const heading = (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: hint ? 0.25 : 0,
          overflowWrap: "anywhere",
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
      {hint ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          {hint}
        </Typography>
      ) : null}
    </Box>
  );

  return (
    <>
      <Card
        sx={{
          p: kind === "chart" ? 1.5 : 1.25,
          minWidth: 0,
          containerType: "inline-size",
          overflow: "hidden",
          ...(tile
            ? { height: "100%", display: "flex", flexDirection: "column" }
            : {}),
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={1}
          sx={{ mb: 0.75 }}
        >
          {heading}
          <Stack
            direction="row"
            alignItems="flex-start"
            sx={{ flexShrink: 0 }}
          >
            {actions?.()}
            <IconButton
              size="small"
              onClick={() => setOpen(true)}
              aria-label={`Open ${title} full screen`}
            >
              <OpenInFull fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        {header}
        {kind === "chart" ? (
          <Box
            sx={
              tile
                ? { flex: 1, width: "100%", minWidth: 0, minHeight: 360 }
                : {
                    width: "100%",
                    minWidth: 0,
                    height: 260,
                    "@container (min-width: 280px)": { height: 320 },
                    "@container (min-width: 360px)": { height: 380 },
                    "@container (min-width: 480px)": { height: 420 },
                  }
            }
          >
            <LabChartExpandedContext.Provider value={false}>
              {children}
            </LabChartExpandedContext.Provider>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>{children}</Box>
        )}
      </Card>
      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            pr: 1.5,
          }}
        >
          {heading}
          <Stack direction="row" alignItems="center" sx={{ flexShrink: 0 }}>
            {actions?.()}
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close full screen"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: kind === "table" ? "auto" : "hidden",
            pb: 2.5,
          }}
        >
          {header ? <Box sx={{ mb: 1.5, flexShrink: 0 }}>{header}</Box> : null}
          {kind === "chart" ? (
            <Box
              sx={{
                flex: 1,
                minHeight: { xs: 360, md: 560 },
                width: "100%",
              }}
            >
              <LabChartExpandedContext.Provider value={true}>
                {children}
              </LabChartExpandedContext.Provider>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto", minWidth: 0 }}>{children}</Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
