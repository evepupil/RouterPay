import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#667085",
        line: "#d9e1e8",
        panel: "#f7fafc",
        brand: "#246bfe",
        success: "#11845b",
        warning: "#b25e09",
        danger: "#c2410c"
      },
      boxShadow: {
        panel: "0 18px 48px rgba(20, 30, 45, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
