import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vinyl & Glow palette
        surface: {
          DEFAULT: "#0b1326",
          dim: "#0b1326",
          bright: "#31394d",
          container: {
            DEFAULT: "#171f33",
            low: "#131b2e",
            high: "#222a3d",
            highest: "#2d3449",
            lowest: "#060e20",
          },
        },
        primary: {
          DEFAULT: "#ffb690",
          container: "#f97316",
        },
        secondary: {
          DEFAULT: "#ffc640",
          container: "#e3aa00",
        },
        tertiary: {
          DEFAULT: "#b9c7e0",
          container: "#8d9bb2",
        },
        "on-surface": {
          DEFAULT: "#dae2fd",
          variant: "#e0c0b1",
        },
        "on-primary": {
          DEFAULT: "#552100",
          container: "#582200",
        },
        "on-secondary": "#402d00",
        outline: {
          DEFAULT: "#a78b7d",
          variant: "#584237",
        },
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
  },
  plugins: [],
};
export default config;
