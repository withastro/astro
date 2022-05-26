const templates = [
	{
		path: 'layer0.config.js',
		template: `
module.exports = {
  "connector": "./layer0",
  "name": "astro-app",
  "routes": "routes.js",
  "backends": {},
  "includeFiles": {
    "public/**/*": true,
    "server/**/*": true,
		"client/**/*": true
  }
}
	`.trim(),
	},
	{
		path: 'routes.js',
		template: `
import { Router } from '@layer0/core';

const TIME_1H = 60 * 60;
const TIME_4H = TIME_1H * 4;
const TIME_1D = TIME_1H * 24;

const CACHE_ASSETS = {
	edge: {
		maxAgeSeconds: TIME_1D,
		forcePrivateCaching: true,
		staleWhileRevalidateSeconds: TIME_1H,
	},
	browser: {
		maxAgeSeconds: 0,
		serviceWorkerSeconds: TIME_1D,
		spa: true,
	},
};

export default new Router().match('/:path*', ({ cache, serveStatic, renderWithApp }) => {
	cache(CACHE_ASSETS);
	// serveStatic('client/:path*', {
	// 	onNotFound: () => renderWithApp,
	// });
	renderWithApp()
});
`.trim(),
	},
	{
		path: 'layer0/build.js',
		template: `
const { DeploymentBuilder } = require('@layer0/core/deploy');
const { join } = require('path');

module.exports = async function build() {
	const builder = new DeploymentBuilder(process.cwd());
	const distDirAbsolute = join(process.cwd());

	builder.clearPreviousBuildOutput();
	builder.copySync(join(distDirAbsolute, 'node_modules'), join(builder.jsDir, 'node_modules'));
	builder.copySync(join(distDirAbsolute, 'package.json'), join(builder.jsDir, 'package.json'));
	builder.copySync(join(distDirAbsolute, 'pnpm-lock.yaml'), join(builder.jsDir, 'pnpm-lock.yaml'));

	await builder.build();
};
`.trim(),
	},
	{
		path: 'layer0/prod.js',
		template: `
const { createServer } = require('http');

module.exports = async function prod(port) {
	const { handler } = await import('../server/entry.mjs')

	const server = createServer(async (req, res) => {
		try {
			console.log('request for', req.url)
			await handler(req, res);
		} catch (e) {
			const message = 'An unexpected error occurred while processing the request with Astro';
			// console.error(e.stack);
			res.writeHead(500);
			res.end(message);
		}
	});

	return new Promise((resolve, reject) => {
    try {
      process.env.PORT = port.toString()
      server.on('listening', resolve);
			server.listen(port);
    } catch (e) {
      reject(e)
    }
  })
};

`.trim(),
	},
];

export default templates;
