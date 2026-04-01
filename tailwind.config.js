/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
     "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        primary: "#2563EB",
        primaryLight: "#3B82F6",
        primaryDark: "#1E40AF",

        // Backgrounds
        bgMain: "#0B0F1A",
        bgCard: "#141A2D",
        bgSoft: "#1A2035",

        // Text
        textPrimary: "#FFFFFF",
        textSecondary: "#A0AEC0",
        textMuted: "#6B7280",

        // Status Colors
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#06B6D4",
      }
    },
  },
  plugins: [],
}
