import { alpha } from "@mui/material/styles";

// ----------------------------------------------------------------------

function createGradient(color1, color2) {
  return `linear-gradient(to bottom, ${color1}, ${color2})`;
}

// SETUP COLORS
const GREY = {
  0: "#FFFFFF",
  100: "#F8FAFC",
  200: "#F1F5F9",
  300: "#E2E8F0",
  400: "#CBD5E1",
  500: "#94A3B8",
  600: "#64748B",
  700: "#475569",
  800: "#334155",
  900: "#1E293B",
  500_8: alpha("#94A3B8", 0.08),
  500_12: alpha("#94A3B8", 0.12),
  500_16: alpha("#94A3B8", 0.16),
  500_24: alpha("#94A3B8", 0.24),
  500_32: alpha("#94A3B8", 0.32),
  500_48: alpha("#94A3B8", 0.48),
  500_56: alpha("#94A3B8", 0.56),
  500_80: alpha("#94A3B8", 0.8),
};

const PRIMARY = {
  lighter: "#E0E7FF",
  light: "#A5B4FC",
  main: "#6366F1",
  dark: "#4F46E5",
  darker: "#3730A3",
  contrastText: "#fff",
};
const SECONDARY = {
  lighter: "#FEF3C7",
  light: "#FDE68A",
  main: "#F59E0B",
  dark: "#D97706",
  darker: "#B45309",
  contrastText: "#000",
};
const INFO = {
  lighter: "#DBEAFE",
  light: "#93C5FD",
  main: "#3B82F6",
  dark: "#2563EB",
  darker: "#1D4ED8",
  contrastText: "#fff",
};
const SUCCESS = {
  lighter: "#D1FAE5",
  light: "#A7F3D0",
  main: "#10B981",
  dark: "#059669",
  darker: "#047857",
  contrastText: "#fff",
};
const WARNING = {
  lighter: "#FEF3C7",
  light: "#FDE68A",
  main: "#F59E0B",
  dark: "#D97706",
  darker: "#B45309",
  contrastText: "#000",
};
const ERROR = {
  lighter: "#FEE2E2",
  light: "#FCA5A5",
  main: "#EF4444",
  dark: "#DC2626",
  darker: "#B91C1C",
  contrastText: "#fff",
};

const TEAM1 = {
  main: "#3B82F6",
  light: "#60A5FA",
  dark: "#2563EB",
  contrastText: "#fff",
};

const TEAM2 = {
  main: "#F59E0B",
  light: "#FBBF24",
  dark: "#D97706",
  contrastText: "#000",
};
const TEAM3 = {
  main: "#10B981",
  light: "#34D399",
  dark: "#059669",
  contrastText: "#fff",
};
const TEAM4 = {
  main: "#8B5CF6",
  light: "#A78BFA",
  dark: "#7C3AED",
  contrastText: "#fff",
};

const GRADIENTS = {
  primary: createGradient(PRIMARY.light, PRIMARY.main),
  info: createGradient(INFO.light, INFO.main),
  success: createGradient(SUCCESS.light, SUCCESS.main),
  warning: createGradient(WARNING.light, WARNING.main),
  error: createGradient(ERROR.light, ERROR.main),
};

const CHART_COLORS = {
  violet: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"],
  blue: ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"],
  green: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  yellow: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
  red: ["#EF4444", "#F87171", "#FCA5A5", "#FECACA"],
};

const palette = {
  common: { black: "#000", white: "#fff" },
  primary: { ...PRIMARY },
  secondary: { ...SECONDARY },

  info: { ...INFO },
  success: { ...SUCCESS },
  warning: { ...WARNING },
  error: { ...ERROR },
  grey: GREY,
  gradients: GRADIENTS,
  chart: CHART_COLORS,
  divider: GREY[500_24],
  text: { primary: GREY[800], secondary: GREY[600], disabled: GREY[500] },
  background: { paper: "#fff", default: GREY[100], neutral: GREY[200] },
  action: {
    active: GREY[600],
    hover: GREY[500_8],
    selected: GREY[500_16],
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
  team1: { ...TEAM1 },
  team2: { ...TEAM2 },
  team3: { ...TEAM3 },
  team4: { ...TEAM4 },
};

export default palette;
