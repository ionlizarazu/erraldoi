/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}", "./public/**/*.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2D3494",
          light: "#4B55C0",
          dark: "#1E2363",
        },
        accent: {
          DEFAULT: "#E6AC40",
          light: "#F0C97A",
          dark: "#B8821C",
        },
        secondary: {
          DEFAULT: "#8BA888",
          light: "#AFC5AE",
          dark: "#678B64",
        },
        surface: {
          DEFAULT: "#F8F9FA",
          muted: "#E9ECEF",
        },
      },
      fontFamily: {
        sans: ["Epilogue", "Inter", "system-ui", "sans-serif"],
        display: ["Epilogue", "sans-serif"],
      },
      borderRadius: {
        custom: "12px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(45, 52, 148, 0.08)",
      },
    },
  },
  plugins: [],
};
