/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f5ff',
          100: '#badeff',
          200: '#8bc8ff',
          300: '#5bb2ff',
          400: '#399dff',
          500: '#1788ff', // Main primary color
          600: '#0e6cd6',
          700: '#0852ad',
          800: '#043884',
          900: '#01205b',
        },
        secondary: {
          50: '#e8fcf7',
          100: '#c5f7eb',
          200: '#9ff2dd',
          300: '#79edd0',
          400: '#59e8c3',
          500: '#38e3b5', // Main secondary color
          600: '#20bb92',
          700: '#14946f',
          800: '#0a6c4e',
          900: '#03442e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-montserrat)'],
      },
      boxShadow: {
        card: '0px 4px 25px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
