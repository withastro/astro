import { writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

export default function() {
	return {
		name: '@astrojs/test-integration',
		hooks: {
			'astro:config:setup': ({ injectRoute, config }) => {
				const entrypoint = fileURLToPath(new URL('./.astro/test.astro', config.root))
				mkdirSync(dirname(entrypoint), { recursive: true })
				writeFileSync(entrypoint, '<h1>Index</h1>')

				injectRoute({
					pattern: '/',
					entrypoint
				})
			}
		}
	}
}
