export default function() {
	return {
		name: '@astrojs/test-integration',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(
					function middleware(req, res, next) {
						res.setHeader('x-middleware', 'true');
						next();
					}
				);
			}
		}
	}
}
