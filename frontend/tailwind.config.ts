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
        cohere: {
          primary: "#17171c",
          black: "#000000",
          ink: "#212121",
          green: "#003c33",
          navy: "#071829",
          canvas: "#ffffff",
          stone: "#eeece7",
          "pale-green": "#edfce9",
          "pale-blue": "#f1f5ff",
          hairline: "#d9d9dd",
          "border-light": "#e5e7eb",
          "card-border": "#f2f2f2",
          muted: "#93939f",
          slate: "#75758a",
          "body-muted": "#616161",
          blue: "#1863dc",
          "focus-blue": "#4c6ee6",
          coral: "#ff7759",
          "coral-soft": "#ffad9b",
          "form-focus": "#9b60aa",
          error: "#b30000",
          "on-dark": "#ffffff",
        },
        retro: {
          red: "#e91d2a",
          "on-red": "#ffffff",
          "sticker-yellow": "#fcc20f",
          purple: "#6a26a4",
          link: "#0000ee",
          olive: "#8e8a25",
          sage: "#b3bd95",
          salmon: "#d77a7a",
          peach: "#e6915d",
          lime: "#c0d4a7",
          sky: "#9ab6c8",
          steel: "#a5b8c0",
          periwinkle: "#8c9ae0",
        },
      },
      fontFamily: {
        display: ["Arial Black", "Arial", "sans-serif"],
        heading: ["Helvetica", "Arial", "sans-serif"],
        body: ["Times New Roman", "Times", "serif"],
        mono: ["Courier New", "Courier", "monospace"],
      },
      borderRadius: {
        none: "0px",
        full: "9999px",
      },
      spacing: {
        xxs: "2px",
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
        section: "80px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
