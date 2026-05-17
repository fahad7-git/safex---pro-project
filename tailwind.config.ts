import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050B14", // Deep cyber dark
        foreground: "#E2E8F0",
        primary: {
          DEFAULT: "#10b981", // Neon green
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#3b82f6", // Neon blue
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444", // Red for dangerous
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "rgba(15, 23, 42, 0.6)",
          foreground: "#E2E8F0",
        },
        border: "rgba(59, 130, 246, 0.2)",
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
