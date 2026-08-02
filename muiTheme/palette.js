import { alpha } from "@mui/material/styles";

// ----------------------------------------------------------------------
// HAVANA PALETTE
// Drawn from the physical game: bone-coloured tiles, espresso pips, a green
// baize table, terracotta rooftops, ochre sun and Malecon blue. Every hue is
// desaturated to roughly the same value so they read as one set.
// ----------------------------------------------------------------------

// Bone: the tile face, the paper of the scorepad, and every neutral in the app.
const BONE = {
  0: "#FFFFFF",
  100: "#FDFAF4",
  200: "#F7F0E3",
  300: "#EFE5D3",
  400: "#DECFB6",
  500: "#BCA888",
  600: "#8C7C63",
  700: "#5F5341",
  800: "#3D3427",
  900: "#241D14",
  500_8: alpha("#BCA888", 0.08),
  500_12: alpha("#BCA888", 0.12),
  500_16: alpha("#BCA888", 0.16),
  500_24: alpha("#BCA888", 0.24),
  500_32: alpha("#BCA888", 0.32),
  500_48: alpha("#BCA888", 0.48),
  500_56: alpha("#BCA888", 0.56),
  500_80: alpha("#BCA888", 0.8),
};

const PRIMARY = {
  lighter: "#D7E5E0",
  light: "#57917F",
  main: "#1F6B58",
  dark: "#154F41",
  darker: "#0D382E",
  contrastText: "#FDFAF4",
};

const SECONDARY = {
  lighter: "#F5DFD4",
  light: "#CE8465",
  main: "#B4542F",
  dark: "#8C3E20",
  darker: "#652B15",
  contrastText: "#FDFAF4",
};

const INFO = {
  lighter: "#DAE5EC",
  light: "#6C93AE",
  main: "#3D6C8C",
  dark: "#2B4E68",
  darker: "#1D374A",
  contrastText: "#FDFAF4",
};

const SUCCESS = {
  lighter: "#DDE8D6",
  light: "#7A9C64",
  main: "#4F7538",
  dark: "#3A5828",
  darker: "#273D1B",
  contrastText: "#FDFAF4",
};

const WARNING = {
  lighter: "#F8E9B8",
  light: "#E8C34A",
  // Richer ochre for winner progress — reads as gold, not sand.
  main: "#D4A017",
  dark: "#9A7510",
  darker: "#6B4A13",
  contrastText: "#241D14",
};

const ERROR = {
  lighter: "#F4DAD5",
  light: "#C77465",
  main: "#A63328",
  dark: "#82241B",
  darker: "#5C1712",
  contrastText: "#FDFAF4",
};

// Four table sides. Green / terracotta / ochre / blue: distinct hues, matched
// saturation, so no single team shouts louder than the others.
const TEAM1 = {
  main: "#1F6B58",
  light: "#57917F",
  dark: "#154F41",
  contrastText: "#FDFAF4",
};
const TEAM2 = {
  main: "#B4542F",
  light: "#CE8465",
  dark: "#8C3E20",
  contrastText: "#FDFAF4",
};
const TEAM3 = {
  main: "#B08422",
  light: "#D0A855",
  dark: "#8A6516",
  contrastText: "#FDFAF4",
};
const TEAM4 = {
  main: "#3D6C8C",
  light: "#6C93AE",
  dark: "#2B4E68",
  contrastText: "#FDFAF4",
};

const palette = {
  common: { black: "#241D14", white: "#FFFFFF" },
  primary: { ...PRIMARY },
  secondary: { ...SECONDARY },
  info: { ...INFO },
  success: { ...SUCCESS },
  warning: { ...WARNING },
  error: { ...ERROR },
  grey: BONE,
  divider: alpha(BONE[700], 0.16),
  text: {
    primary: BONE[900],
    secondary: BONE[700],
    disabled: BONE[500],
  },
  background: {
    paper: BONE[100],
    default: "#F1E7D6",
    neutral: BONE[300],
  },
  action: {
    active: BONE[700],
    hover: alpha(PRIMARY.main, 0.06),
    selected: alpha(PRIMARY.main, 0.1),
    disabled: alpha(BONE[700], 0.32),
    disabledBackground: alpha(BONE[700], 0.12),
    focus: alpha(PRIMARY.main, 0.16),
    hoverOpacity: 0.06,
    disabledOpacity: 0.4,
  },
  team1: { ...TEAM1 },
  team2: { ...TEAM2 },
  team3: { ...TEAM3 },
  team4: { ...TEAM4 },
};

export default palette;
