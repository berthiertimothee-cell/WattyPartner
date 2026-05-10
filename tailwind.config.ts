import type { Config } from "tailwindcss";

// Watty brand palette — inspired by WattyBrandDesign.
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8093F1", // periwinkle blue / primary
          600: "#B388EB", // lavender / secondary
          500: "#8093F1",
          300: "#F7AEF8", // pink accent
          50: "#FCFFFC", // soft white
          100: "#F6F2FF",
        },
        watty: {
          pink: "#F7AEF8",
          purple: "#B388EB",
          blue: "#8093F1",
          white: "#FCFFFC",
        },
        ink: "#16142A",
        muted: "#6B6680",
        canvas: "#FCFFFC",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,20,42,0.04), 0 1px 3px rgba(22,20,42,0.06)",
        cardHover: "0 10px 30px rgba(128,147,241,0.16)",
        pop: "0 16px 42px rgba(179,136,235,0.22)",
        glow: "0 18px 60px rgba(247,174,248,0.35)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "watty-gradient": "linear-gradient(135deg, #8093F1 0%, #B388EB 52%, #F7AEF8 100%)",
        "watty-soft": "radial-gradient(circle at top left, rgba(247,174,248,0.32), transparent 34%), radial-gradient(circle at top right, rgba(128,147,241,0.26), transparent 32%), #FCFFFC",
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
