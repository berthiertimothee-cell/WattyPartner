import type { Config } from "tailwindcss";

// Watty brand palette — calm, premium B2B SaaS (Airbnb / Stripe / Notion feel).
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B1F4D", // royal dark blue (primary)
          600: "#1E4ED8", // secondary blue
          50: "#EEF2FF",
          100: "#E0E7FF",
        },
        ink: "#111827",
        muted: "#6B7280",
        canvas: "#F8FAFC",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        cardHover: "0 8px 24px rgba(16,24,40,0.08)",
        pop: "0 12px 32px rgba(11,31,77,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-in": "fade-in 0.25s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
