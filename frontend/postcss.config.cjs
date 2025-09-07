// Explicit plugin requires help Vite/PostCSS resolve plugin functions.
module.exports = {
  plugins: [
    // tailwind postcss adapter
    require('@tailwindcss/postcss'),
    // add autoprefixer
    require('autoprefixer'),
  ],
}
