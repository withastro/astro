import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		{
			name: 'server-middlewares',
			hooks: {
				'astro:server:setup'({ server }) {
					console.log('Server setup');
					server.middlewares.use((req, res, next) => {
						console.log('Server middleware');
						next();
					});
				},
			},
		},
	],
});
