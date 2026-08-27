/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tac: {
          bg:       "#091208",
          surface:  "#0d1f0d",
          "surface-alt": "#0a180a",
          border:   "#1a3a1a",
          "border-active": "#2d5a2d",
          primary:  "#84cc74",
          accent:   "#4ade80",
          bright:   "#a3e635",
          muted:    "#4a7a4a",
          dim:      "#2a4a2a",
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
