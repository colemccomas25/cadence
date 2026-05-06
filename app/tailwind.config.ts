import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy — kept for backward compatibility, not used in marketing routes
        brand: {
          50: "#f5f7ff",
          100: "#eef0ff",
          500: "#5b6cff",
          600: "#4856e6",
          700: "#3a47b8",
        },
        cta: "var(--cta)",
        // Semantic tokens
        paper:       "var(--bg-page)",
        surface:     "var(--bg-surface)",
        muted:       "var(--bg-muted)",
        ink:         "var(--fg-default)",
        inkMuted:    "var(--fg-muted)",
        inkSubtle:   "var(--fg-subtle)",
        line:        "var(--border-default)",
        lineStrong:  "var(--border-strong)",
        accent:      "var(--accent)",
        accentHover: "var(--accent-hover)",
        accentSoft:  "var(--accent-soft)",
        success:     "var(--success)",
        danger:      "var(--danger)",
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        xl:  "20px",
        lg:  "14px",
        md:  "10px",
        sm:  "6px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
