"use client";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Close,
  PlayArrow,
  History,
  BarChart,
  Settings,
  Home,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileMenu({ open, onClose, onNavigate }) {
  const menuItems = [
    {
      icon: <Home />,
      label: "Dashboard",
      action: "dashboard",
    },
    {
      icon: <PlayArrow />,
      label: "New Game",
      action: "game",
    },
    {
      icon: <History />,
      label: "Game History",
      action: "history",
    },
    {
      icon: <BarChart />,
      label: "Statistics",
      action: "stats",
    },
    {
      icon: <Settings />,
      label: "Settings",
      action: "settings",
    },
  ];

  const handleItemClick = (action) => {
    onNavigate(action);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          borderLeft: "1px solid rgba(99, 102, 241, 0.1)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" className="gradient-text">
            Menu
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List>
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleItemClick(item.action)}
                    sx={{
                      borderRadius: 2,
                      "&:hover": {
                        background: "rgba(99, 102, 241, 0.1)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "primary.main", minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </Box>
    </Drawer>
  );
}
