import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
  vite: {
  	environments: {
  		client: {
		    build: {
		      rollupOptions: {
		        output: {
		          entryFileNames: `assets/js/[name].js`,
		        },
		      },
		    },
    	},
  	},
  },
});
