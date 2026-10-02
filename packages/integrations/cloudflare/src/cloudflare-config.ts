import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { loadAndParseConfig } from '@cloudflare/config';
import type { PluginConfig } from '@cloudflare/vite-plugin';

export const DEFAULT_SESSION_KV_BINDING_NAME = 'SESSION';
export const DEFAULT_IMAGES_BINDING_NAME = 'IMAGES';
export const DEFAULT_ASSETS_BINDING_NAME = 'ASSETS';

const DEFAULT_WORKER_ENTRYPOINT = '@astrojs/cloudflare/entrypoints/server';

/**
 * Compatibility flags that make `AsyncLocalStorage` (`node:async_hooks`)
 * available in workerd.
 */
const ALS_CAPABLE_FLAGS = ['nodejs_als', 'nodejs_compat', 'nodejs_compat_v2'];

/**
 * Returns the compatibility flags for the build-time prerender worker,
 * auto-appending `nodejs_als` when no ALS-capable flag is already present.
 *
 * The prerender worker installs an AsyncLocalStorage-backed render scope (see
 * `utils/prerender-scope.ts`) so concurrent prerender requests attribute
 * incremental-build metadata to the right path; `nodejs_als` makes
 * `node:async_hooks` resolvable in that worker. This only ever shapes the
 * transient build-time prerender worker config — the user's deployed Cloudflare
 * config is untouched.
 */
export function withNodejsAlsFlag(compatibilityFlags: string[] | undefined): string[] {
	const flags = compatibilityFlags ?? [];
	if (flags.some((flag) => ALS_CAPABLE_FLAGS.includes(flag))) {
		return flags;
	}
	return [...flags, 'nodejs_als'];
}

interface CloudflareConfigOptions {
	envDir?: string;
	mode?: string;
	sessionKVBindingName?: string | undefined;
	needsSessionKVBinding?: boolean;
	imagesBindingName?: string | false | undefined;
	needsWorkerCache?: boolean;
}

type PluginConfigCustomizer = Extract<
	NonNullable<PluginConfig['config']>,
	(...args: never[]) => unknown
>;
type CloudflareWorkerConfig = Parameters<PluginConfigCustomizer>[0];
type CloudflareConfigCustomizer = (
	config: Partial<CloudflareWorkerConfig>,
) => Partial<CloudflareWorkerConfig>;

function setProcessEnvFromBindings(
	config: Partial<CloudflareWorkerConfig>,
	envDir: string | undefined,
	mode: string | undefined,
): void {
	for (const [name, binding] of Object.entries(config.env ?? {})) {
		if (binding.type === 'text') {
			process.env[name] = binding.value;
		} else if (binding.type === 'json') {
			process.env[name] = JSON.stringify(binding.value);
		}
	}

	if (!envDir) return;
	const devVarsPath = [mode ? `.dev.vars.${mode}` : undefined, '.dev.vars']
		.filter((file): file is string => file !== undefined)
		.map((file) => join(envDir, file))
		.find((file) => existsSync(file));
	if (!devVarsPath) return;

	const devVars = parseEnv(readFileSync(devVarsPath, 'utf-8'));
	for (const [name, binding] of Object.entries(config.env ?? {})) {
		if (binding.type === 'secret' && devVars[name] !== undefined) {
			process.env[name] = devVars[name];
		}
	}
}

/**
 * Returns whether `cloudflare.config.ts` in `root` sets `worker.entrypoint` to
 * something other than the adapter's default server entrypoint. Returns `false`
 * when the file does not exist or does not parse; the Cloudflare Vite plugin
 * reports invalid configs itself.
 */
export async function hasCustomWorkerEntrypoint(root: URL, mode: string): Promise<boolean> {
	const configPath = join(fileURLToPath(root), 'cloudflare.config.ts');
	if (!existsSync(configPath)) return false;
	const { result } = await loadAndParseConfig(configPath, {
		// Matches how `@cloudflare/vite-plugin` evaluates the config.
		isPreview: process.env.CLOUDFLARE_PREVIEW_BUILD === 'true',
		mode,
	});
	const entrypoint = result.success ? result.data.worker?.entrypoint : undefined;
	return entrypoint !== undefined && entrypoint !== DEFAULT_WORKER_ENTRYPOINT;
}

/**
 * Returns a Cloudflare config customizer that sets up the Astro defaults.
 * Sets the Worker entrypoint and adds bindings for auto-provisioning.
 */
export function cloudflareConfigCustomizer(
	options?: CloudflareConfigOptions,
): CloudflareConfigCustomizer {
	const sessionKVBindingName = options?.sessionKVBindingName ?? DEFAULT_SESSION_KV_BINDING_NAME;
	const needsSessionKVBinding = options?.needsSessionKVBinding ?? true;
	const imagesBindingName =
		options?.imagesBindingName === false
			? undefined
			: (options?.imagesBindingName ?? DEFAULT_IMAGES_BINDING_NAME);
	const needsWorkerCache = options?.needsWorkerCache ?? false;

	return (config) => {
		setProcessEnvFromBindings(config, options?.envDir, options?.mode);
		const hasImagesBinding = Object.values(config.env ?? {}).some(
			(binding) => binding.type === 'images',
		);
		const hasAssetsBinding = Object.values(config.env ?? {}).some(
			(binding) => binding.type === 'assets',
		);
		return {
			entrypoint: config.entrypoint ?? DEFAULT_WORKER_ENTRYPOINT,
			env: {
				...(!needsSessionKVBinding || config.env?.[sessionKVBindingName]
					? {}
					: { [sessionKVBindingName]: { type: 'kv' } }),
				...(!imagesBindingName || hasImagesBinding
					? {}
					: { [imagesBindingName]: { type: 'images' } }),
				...(hasAssetsBinding ? {} : { [DEFAULT_ASSETS_BINDING_NAME]: { type: 'assets' } }),
			},
			// Enable the Worker caching layer when a Cloudflare cache provider is configured
			cache:
				needsWorkerCache && config.cache?.enabled === undefined ? { enabled: true } : undefined,
		};
	};
}
