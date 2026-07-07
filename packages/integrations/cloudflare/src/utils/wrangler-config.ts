import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegrationLogger } from 'astro';
import { unstable_getVarsForDev, unstable_readConfig } from 'wrangler';

const DEFAULT_WRANGLER_CONFIG_FILES = ['wrangler.toml', 'wrangler.json', 'wrangler.jsonc'];

function resolveWranglerConfigPath(root: URL, configPath: string | undefined): string | undefined {
	if (configPath) {
		return fileURLToPath(new URL(configPath, root));
	}
	for (const file of DEFAULT_WRANGLER_CONFIG_FILES) {
		const candidate = new URL(`./${file}`, root);
		if (existsSync(candidate)) {
			return fileURLToPath(candidate);
		}
	}
	return undefined;
}

/**
 * Resolves the effective environment variables for the project's Wrangler config
 * — `vars` merged with any `.dev.vars`/`.env` overrides, exactly as `wrangler dev`
 * resolves them — and assigns them to `process.env`.
 *
 * Astro's `astro:env` inlines public variables at build time using Vite's
 * `loadEnv()`, which only reads from `process.env` and `.env` files. Cloudflare
 * makes these variables available at runtime (through `cloudflare:workers`), but
 * they are invisible to the build-time step, so direct imports resolve to
 * `undefined`. Surfacing them on `process.env` here lets `astro:env` pick them up
 * during the build.
 */
export function loadWranglerEnv(
	root: URL,
	configPath: string | undefined,
	logger: AstroIntegrationLogger,
): void {
	const resolvedConfigPath = resolveWranglerConfigPath(root, configPath);
	if (!resolvedConfigPath) {
		return;
	}

	try {
		const env = process.env.CLOUDFLARE_ENV;
		const config = unstable_readConfig({ config: resolvedConfigPath, env }, { hideWarnings: true });

		// Merges config `vars` with `.dev.vars`/`.dev.vars.<env>`/`.env` overrides,
		// matching wrangler's own precedence (local files override config `vars`).
		const vars = unstable_getVarsForDev(
			config.configPath,
			undefined,
			config.vars,
			env,
			true,
			config.secrets,
		);

		for (const [key, binding] of Object.entries(vars)) {
			// `vars` can hold non-string JSON values (numbers, booleans, objects).
			// `process.env` only stores strings.
			const value = binding.value;
			if (value === undefined || value === null) {
				continue;
			}
			process.env[key] = typeof value === 'string' ? value : JSON.stringify(value);
		}
	} catch (e) {
		logger.warn(
			`Unable to read wrangler config, variables defined in it will not be available to astro:env at build time.`,
		);
		logger.debug(String(e));
	}
}
