/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary50: "var(--primary-50)",
        primary100: "var(--primary-100)",
        primary400: "var(--primary-400)",
        primary500: "var(--primary-500)",
        primary600: "var(--primary-600)",
        primary700: "var(--primary-700)",

        accent50: "var(--accent-50)",
        accent400: "var(--accent-400)",
        accent500: "var(--accent-500)",
        accent600: "var(--accent-600)",

        gray50: "var(--gray-50)",
        gray100: "var(--gray-100)",
        gray200: "var(--gray-200)",
        gray600: "var(--gray-600)",
        gray700: "var(--gray-700)",
        gray800: "var(--gray-800)",

        whiteCustom: "var(--white)",
      },
    },
  },
  plugins: [],
};
