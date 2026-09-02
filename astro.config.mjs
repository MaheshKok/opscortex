import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // TODO: replace with real domain when you have one
  site: 'https://opscortex.example',
  integrations: [mdx()],
  vite: { plugins: [tailwindcss()] },
});
