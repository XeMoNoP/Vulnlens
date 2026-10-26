import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dmart: {
          green: "#0a8754",
          darkgreen: "#075e37",
          lightgreen: "#e8f5e9",
          yellow: "#fbc02d",
          accent: "#ff9800",
        },
      },
    },
  },
  plugins: [],
};
export default config;
