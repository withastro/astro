import { type PluginConfig } from '@cloudflare/vite-plugin';
import type { AstroIntegration } from 'astro';
import { type ImageServiceConfig } from './utils/image-config.js';
export type { Runtime } from './utils/handler.js';
export interface Options extends Pick<
	PluginConfig,
	'auxiliaryWorkers' | 'configPath' | 'inspectorPort' | 'persistState' | 'remoteBindings'
> {
	/** Options for handling images. */
	imageService?: ImageServiceConfig;
	/**
	 * By default, Astro will be configured to use Cloudflare KV to store session data. The KV namespace
	 * will be automatically provisioned when you deploy.
	 *
	 * By default, the binding is named `SESSION`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning for more details.
	 */
	sessionKVBindingName?: string;
	/**
	 * When `imageService` is set to `cloudflare-binding`, the Cloudflare Images binding will be used
	 * to transform images. The binding will be automatically configured for you.
	 *
	 * By default, the binding is named `IMAGES`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/images/transform-images/bindings/ for more details.
	 */
	imagesBindingName?: string;
	/**
	 * Controls which runtime is used for prerendering static pages at build time.
	 *
	 * - `'workerd'` (default): Uses Cloudflare's workerd runtime.
	 * - `'node'`: Uses Astro's default node prerender environment.
	 */
	prerenderEnvironment?: 'workerd' | 'node';
	experimental?: Pick<
		NonNullable<PluginConfig['experimental']>,
		'headersAndRedirectsDevModeSupport'
	>;
}
export default function createIntegration({
	imageService,
	sessionKVBindingName,
	imagesBindingName,
	prerenderEnvironment,
	...cloudflareOptions
}?: Options): AstroIntegration;
