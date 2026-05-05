import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // tweak these once you pick a brand palette
        brand: {
          50: "#f5f7ff",
          500: "#5b6cff",
          600: "#4856e6",
          700: "#3a47b8",
        },
        cta: "var(--cta)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
