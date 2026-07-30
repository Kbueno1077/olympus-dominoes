function pxToRem(value) {
  return `${value / 16}rem`;
}

function responsiveFontSizes({ sm, md, lg }) {
  return {
    "@media (min-width:600px)": {
      fontSize: pxToRem(sm),
    },
    "@media (min-width:900px)": {
      fontSize: pxToRem(md),
    },
    "@media (min-width:1200px)": {
      fontSize: pxToRem(lg),
    },
  };
}

// Geist is loaded by next/font in the root layout and exposed as a CSS
// variable, so MUI, Tailwind and plain CSS all resolve to the same file.
export const FONT_PRIMARY =
  'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// A serif for the wordmark and page headings: the painted signage and cafe
// menus of old Havana. Deliberately a system stack so it costs no network.
export const FONT_DISPLAY =
  'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

// Scores are numbers in columns; tabular figures keep them aligned.
export const FONT_SCORE =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

// Reserved for the hands pencilled onto the scorepad, the way they would be
// written on a real notepad. Kept off every other surface on purpose.
export const FONT_HAND =
  'var(--font-hand), "Bradley Hand", "Segoe Script", cursive';

const typography = {
  fontFamily: FONT_PRIMARY,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    fontSize: pxToRem(40),
    ...responsiveFontSizes({ sm: 50, md: 56, lg: 62 }),
  },
  h2: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    fontSize: pxToRem(30),
    ...responsiveFontSizes({ sm: 38, md: 42, lg: 46 }),
  },
  h3: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
    fontSize: pxToRem(24),
    ...responsiveFontSizes({ sm: 26, md: 29, lg: 31 }),
  },
  h4: {
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
    fontSize: pxToRem(20),
    ...responsiveFontSizes({ sm: 20, md: 23, lg: 23 }),
  },
  h5: {
    fontWeight: 700,
    lineHeight: 1.45,
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ sm: 18, md: 19, lg: 19 }),
  },
  h6: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
    ...responsiveFontSizes({ sm: 16, md: 17, lg: 17 }),
  },
  subtitle1: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontWeight: 600,
    lineHeight: 1.55,
    fontSize: pxToRem(14),
  },
  body1: {
    lineHeight: 1.6,
    fontSize: pxToRem(16),
  },
  body2: {
    lineHeight: 1.6,
    fontSize: pxToRem(14),
  },
  caption: {
    lineHeight: 1.5,
    fontSize: pxToRem(12),
  },
  // Small caps labels ("MATCH SETUP", "TEAM 1") are the main texture in the
  // interface, standing in for the colour that used to carry hierarchy.
  overline: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(11),
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  button: {
    fontWeight: 600,
    lineHeight: 1.6,
    fontSize: pxToRem(14),
    letterSpacing: "0.01em",
    textTransform: "none",
  },
};

export default typography;
