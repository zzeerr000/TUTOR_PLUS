/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 215 215 / 0.1)",
        input: "transparent",
        inputBackground: "#f3f3f5",
        switchBackground: "#cbced4",
        ring: "hsl(0 71 71 / 1)",
        muted: "#ececf0",
        mutedForeground: "#717182",
        accent: "#e9ebef",
        accentForeground: "#030213",
        destructive: "#d4183d",
        destructiveForeground: "#ffffff",
        background: "#ffffff",
        foreground: "oklch(0.145 0 0)",
        card: "#f8f8f8",
        cardForeground: "oklch(0.145 0 0)",
        popover: "oklch(1 0 0)",
        popoverForeground: "oklch(0.145 0 0)",
        primary: "#030213",
        primaryForeground: "oklch(1 0 0)",
        secondary: "oklch(0.95 0.0058 264.53)",
        secondaryForeground: "#030213",
        chart: {
          1: "oklch(0.646 0.222 41.116)",
          2: "oklch(0.6 0.118 184.704)",
          3: "oklch(0.398 0.07 227.392)",
          4: "oklch(0.828 0.189 84.429)",
          5: "oklch(0.769 0.188 70.08)",
        },
        sidebar: {
          DEFAULT: "oklch(0.985 0 0)",
          foreground: "oklch(0.145 0 0)",
          primary: "#030213",
          primaryForeground: "oklch(0.985 0 0)",
          accent: "oklch(0.97 0 0)",
          accentForeground: "oklch(0.205 0 0)",
          border: "oklch(0.922 0 0)",
          ring: "oklch(0.708 0 0)",
        }
      },
      fontSize: {
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      fontWeight: {
        medium: "500",
        normal: "400",
      },
      borderRadius: {
        lg: "0.625rem",
      }
    },
  },
  plugins: [],
}
