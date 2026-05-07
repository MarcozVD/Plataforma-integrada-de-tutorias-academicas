/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        unab: {
          blue: "#00AEEF",
          "blue-dark": "#0090C5",
          "blue-darker": "#00719B",
          green: "#8DC63F",
          "green-dark": "#578426",
          purple: "#6B2D8B",
          orange: "#FF9900",
          "orange-dark": "#e08800",
        },
      },
    },
  },
  plugins: [],
};
