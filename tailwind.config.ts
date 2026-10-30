import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dfe9ff", 200: "#c5d7fe", 300: "#a4bcfc",
          400: "#8098f9", 500: "#6172f3", 600: "#444ce7", 700: "#3538cd",
          800: "#2a2d9e", 900: "#262a7a",
        },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
