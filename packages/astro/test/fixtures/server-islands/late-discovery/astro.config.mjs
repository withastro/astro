import { defineConfig } from 'astro/config';
import testAdapter from '../../../test-adapter.ts';

export default defineConfig({
  adapter: testAdapter(),
  output: 'server',
  serverIslands: { routePrefix: '/_custom-islands/' },
});
