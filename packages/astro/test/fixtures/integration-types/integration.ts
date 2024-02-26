import type { AstroIntegration } from "astro";
import { existsSync } from "node:fs"

export default function(): AstroIntegration {
	let exists = false;

	return {
		name: '@astrojs/test-integration',
		hooks: {
			'astro:config:setup': ({ codegenDir, injectDts }) => {
				exists = existsSync(codegenDir)
				injectDts({
					filename: 'test.d.ts',
					content: 'type Test = string;'
				})
			},
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(
					function middleware(req, res, next) {
						res.setHeader('x-codegendir-exists', JSON.stringify(exists));
						next();
					}
				);
			}
		}
	}
}
