const flattenColorPalette = require('tailwindcss/lib/util/flattenColorPalette');
const aspectRatio = require('@tailwindcss/aspect-ratio');

module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}', // Adjust the paths based on your project structure
  ],
  theme: {
    extend: {
      animation: {
        'meteor-effect': 'meteor 5s linear infinite'
      },
      keyframes: {
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: 1 },
          '70%': { opacity: 1 },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: 0
          }
        }
      }
    },
  },
  plugins: [
    aspectRatio,
    addVariablesForColors
  ],
}

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme('colors'));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ':root': newVars
  });
}
