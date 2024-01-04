import { defineConfig } from 'astro/config'

type Config = {
	foo: string;
};

interface Hooks {
	'a:config'?: (config: {config: Config}) => void;
};

declare global {
	namespace AstroConfig {
		interface IntegrationHooks extends Hooks { }
	}
}

export default defineConfig({
	integrations: [
		{
			name: 'a',
			hooks: {
				'astro:config:setup': ({ callHook }) => {
					callHook('a:config', { config: { foo: 'bar' }})
				}
			}
		},
		(() => {
			let config: Config;

			return {
				name: 'b',
				hooks: {
					'a:config': ({ config: _config }) => {
						config = _config;
					},
					'astro:server:setup': async ({ server }) => {
						server.middlewares.use(
							function middleware(req, res, next) {
								res.setHeader('x-config', JSON.stringify(config));
								next();
							}
						);
					}
				}
			}
		})()
	]
})
