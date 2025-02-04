/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      width: ['group-hover'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}