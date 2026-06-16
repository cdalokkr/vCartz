import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative asset paths, making the site portable on any subpath like GitHub Pages
});
