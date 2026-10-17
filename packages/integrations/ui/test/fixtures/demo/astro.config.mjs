import ui from '@astrojs/ui/integration';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [ui()],
})
