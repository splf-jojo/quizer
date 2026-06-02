/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 50px rgba(20, 20, 28, 0.12)"
      }
    }
  },
  plugins: []
};
