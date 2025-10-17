// Explicit plugin requires help Vite/PostCSS resolve plugin functions.
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
