import { alpha } from "@mui/material/styles";
import palette from "./palette";

// Shadows are tinted with the espresso brown rather than a neutral black so
// that surfaces sit on the warm background instead of floating above it.
const SHADOW_TONE = palette.grey[800];

const createShadow = (color) => {
  const soft = alpha(color, 0.1);
  const mid = alpha(color, 0.07);
  const wide = alpha(color, 0.05);

  return [
    "none",
    `0 1px 2px 0 ${soft}`,
    `0 1px 3px 0 ${soft}, 0 1px 2px -1px ${mid}`,
    `0 2px 4px -1px ${soft}, 0 1px 3px -1px ${mid}`,
    `0 2px 6px -1px ${soft}, 0 2px 4px -2px ${mid}`,
    `0 4px 8px -2px ${soft}, 0 2px 4px -2px ${mid}`,
    `0 4px 10px -2px ${soft}, 0 2px 6px -2px ${mid}`,
    `0 6px 12px -3px ${soft}, 0 3px 6px -3px ${mid}`,
    `0 6px 16px -4px ${soft}, 0 4px 8px -4px ${mid}`,
    `0 8px 18px -4px ${soft}, 0 4px 10px -4px ${mid}`,
    `0 8px 20px -5px ${soft}, 0 5px 12px -5px ${mid}`,
    `0 10px 22px -5px ${soft}, 0 5px 14px -5px ${mid}`,
    `0 10px 24px -6px ${soft}, 0 6px 16px -6px ${mid}`,
    `0 12px 26px -6px ${soft}, 0 6px 18px -6px ${mid}`,
    `0 12px 28px -7px ${soft}, 0 7px 20px -7px ${mid}`,
    `0 14px 30px -7px ${soft}, 0 7px 22px -7px ${wide}`,
    `0 14px 32px -8px ${soft}, 0 8px 24px -8px ${wide}`,
    `0 16px 34px -8px ${soft}, 0 8px 26px -8px ${wide}`,
    `0 16px 36px -9px ${soft}, 0 9px 28px -9px ${wide}`,
    `0 18px 38px -9px ${soft}, 0 9px 30px -9px ${wide}`,
    `0 18px 40px -10px ${soft}, 0 10px 32px -10px ${wide}`,
    `0 20px 42px -10px ${soft}, 0 10px 34px -10px ${wide}`,
    `0 20px 44px -11px ${soft}, 0 11px 36px -11px ${wide}`,
    `0 22px 46px -11px ${soft}, 0 11px 38px -11px ${wide}`,
    `0 24px 48px -12px ${soft}, 0 12px 40px -12px ${wide}`,
  ];
};

const createCustomShadow = (color) => {
  const transparent = alpha(color, 0.12);

  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z8: `0 8px 16px -4px ${transparent}`,
    z12: `0 0 2px 0 ${transparent}, 0 12px 24px -6px ${transparent}`,
    z16: `0 0 2px 0 ${transparent}, 0 16px 32px -8px ${transparent}`,
    z20: `0 0 2px 0 ${transparent}, 0 20px 40px -10px ${transparent}`,
    z24: `0 0 4px 0 ${transparent}, 0 24px 48px -12px ${transparent}`,
    primary: `0 6px 14px -4px ${alpha(palette.primary.main, 0.32)}`,
    secondary: `0 6px 14px -4px ${alpha(palette.secondary.main, 0.32)}`,
    info: `0 6px 14px -4px ${alpha(palette.info.main, 0.32)}`,
    success: `0 6px 14px -4px ${alpha(palette.success.main, 0.32)}`,
    warning: `0 6px 14px -4px ${alpha(palette.warning.main, 0.32)}`,
    error: `0 6px 14px -4px ${alpha(palette.error.main, 0.32)}`,
    // The scorepad and tiles get a crisper, closer shadow so they read as
    // physical objects resting on the table.
    tile: `0 1px 0 0 ${alpha(color, 0.16)}, 0 2px 4px -1px ${alpha(color, 0.18)}`,
  };
};

export const customShadows = createCustomShadow(SHADOW_TONE);

const shadows = createShadow(SHADOW_TONE);

export default shadows;
