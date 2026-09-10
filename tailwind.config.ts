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
        brand: {
          primary: "#ff7533",
          secondary: "#505050",
          accent: "#fd874d",
          muted: "#ffa64e",
        },
        background: "#0a0a0a",
        foreground: "#ededed",
      },
      fontFamily: {
        geist: ["var(--font-geist-sans)"],
        serif: ["var(--font-inria-serif)"],
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
      },
    },
  },
  plugins: [],
};
export default config;


