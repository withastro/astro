import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	experimental: {
		env: {
			schema: {
				PUBLIC_FOO: envField.string({ context: "client", access: "public", optional: true, default: "ABC" }),
				PUBLIC_BAR: envField.string({ context: "client", access: "public", optional: true, default: "DEF" }),
				PUBLIC_BAZ: envField.string({ context: "server", access: "public", optional: true, default: "GHI" }),
			}
		}
	}
});
