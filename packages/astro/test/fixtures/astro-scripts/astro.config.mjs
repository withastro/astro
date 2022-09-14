import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
	integrations: [
		tailwind()
		// {
		// 	name: '@test-inject-script',
		// 	hooks: {
		// 		'astro:config:setup'({ injectScript, updateConfig }) {
		// 			injectScript('page-ssr', `import 'virtual:test';`);
		// 			updateConfig({
		// 				vite: {
		// 					plugins: [
		// 						{
		// 							name: '@test-inject-script',
		// 							resolveId(id) {
		// 								if(id === 'virtual:test') {
		// 									return id;
		// 								}
		// 							},
		// 							load(id) {
		// 								if(id === 'virtual:test') {
		// 									console.log('loading it');
		// 									return 'export default void 0;'
		// 								}
		// 							}
		// 						}
		// 					]
		// 				}
		// 			})
		// 		}
		// 	}
		// }
	]
})
