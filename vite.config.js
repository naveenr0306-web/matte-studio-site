import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Inlines the wordmark SVG symbol so the logo can be recoloured with CSS.
const logoSymbol = () => ({
  name: 'logo-symbol',
  transformIndexHtml: (html) => html.replace('<!--LOGO_SYMBOL-->', readFileSync('src/logo-paths.html', 'utf8')),
});

export default defineConfig({
  base: './',
  plugins: [logoSymbol()],
  build: { outDir: 'dist', assetsInlineLimit: 0, cssCodeSplit: false },
});
