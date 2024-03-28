import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		{
			name: '404-integration',
			hooks: {
				'astro:config:setup': ({ injectAsset }) => {
					const urlPathOne = injectAsset({
						entrypoint: '@test/custom-404-pkg/404.astro',
					});
					console.log("DEBUG", urlPathOne);
					const urlPathTwo = injectAsset({
						entrypoint: '@test/custom-404-pkg/404.astro',
						outDir: './my-assets'
					});
					console.log("DEBUG", urlPathTwo);
					const urlPathThree = injectAsset({
						entrypoint: '@test/custom-404-pkg/testy',
						outDir: './my-assets'
					});
					console.log("DEBUG", urlPathThree);
				},
			},
		},
	],
});
