import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Space Grotesk", "sans-serif"]
      },
      colors: {
        background: "#060816",
        foreground: "#f7fbff",
        muted: "#8ea0c6",
        card: "#0e1428",
        border: "rgba(148, 163, 184, 0.14)",
        accent: {
          DEFAULT: "#54d2ff",
          warm: "#8bffb0",
          amber: "#ffbb70",
          danger: "#ff6b8b"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(84,210,255,.15), 0 20px 70px rgba(13, 28, 63, .55)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(84,210,255,.18), transparent 33%), radial-gradient(circle at top right, rgba(139,255,176,.12), transparent 28%), linear-gradient(180deg, #060816 0%, #0a1120 100%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
