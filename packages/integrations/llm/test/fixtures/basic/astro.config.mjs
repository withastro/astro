import nodeServer from '@astrojs/node';
import llm from '@astrojs/llm';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [llm()],
  site: 'http://example.com',
  output: 'server',
  adapter: nodeServer({
    mode: 'standalone'
  })
});
