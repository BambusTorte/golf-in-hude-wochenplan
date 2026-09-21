import type { Config } from "tailwindcss";

/**
 * Design tokens abgeleitet aus der Designreferenz
 * (golf-in-hude-vorgabe-rechner.netlify.app):
 *   - Primärgrün #094D3B, tiefes Waldgrün-Verlauf
 *   - Weiße abgerundete Cards mit weichem Schatten
 *   - Helle Lime-Akzente ("Golf. In Hude!")
 *   - Font: Plus Jakarta Sans
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6f1",
          100: "#d6e9df",
          200: "#aed3c0",
          300: "#7db89c",
          400: "#4e9c78",
          500: "#2f8060",
          600: "#166a4c",
          700: "#094d3b", // Primärgrün (Body-Hintergrund)
          800: "#073d2f",
          900: "#053024",
          950: "#032018",
        },
        accent: {
          300: "#9fe3ba",
          400: "#7bd3a0",
          500: "#57c184", // Lime-Akzent (Claim, Chevrons)
          600: "#3fa96c",
        },
        ink: {
          DEFAULT: "#0b3529", // dunkler Fließtext auf Cards
          muted: "#5f7d72",
          soft: "#8aa89c",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
        badge: "0.75rem",
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(3, 32, 24, 0.25)",
        "card-lg": "0 24px 60px -20px rgba(3, 32, 24, 0.35)",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
