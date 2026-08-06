/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    // MUI's CssBaseline owns the base layer; Tailwind preflight would fight it.
    preflight: false,
  },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        bone: {
          100: "rgb(var(--bone-100) / <alpha-value>)",
          200: "rgb(var(--bone-200) / <alpha-value>)",
          300: "rgb(var(--bone-300) / <alpha-value>)",
          400: "rgb(var(--bone-400) / <alpha-value>)",
          500: "rgb(var(--bone-500) / <alpha-value>)",
          600: "rgb(var(--bone-600) / <alpha-value>)",
          700: "rgb(var(--bone-700) / <alpha-value>)",
          800: "rgb(var(--bone-800) / <alpha-value>)",
          900: "rgb(var(--bone-900) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
