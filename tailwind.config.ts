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
        background: "#080c14",
        surface: "#0f1623",
        "surface-raised": "#172234",
        "surface-card": "#131b2b",
        border: "#1e2c44",
        "border-light": "#2a3d5e",
        primary: {
          DEFAULT: "#6366f1", // indigo
          hover: "#4f46e5",
          light: "#818cf8",
        },
        accent: {
          DEFAULT: "#06b6d4", // cyan
          hover: "#0891b2",
        },
        success: {
          DEFAULT: "#10b981", // emerald
          hover: "#059669",
        },
        warning: {
          DEFAULT: "#f59e0b",
        },
        danger: {
          DEFAULT: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
