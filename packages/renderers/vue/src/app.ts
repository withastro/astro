import loadAppEntrypoint from 'virtual:astro:app-entrypoint/@astrojs/vue';
import type { App } from 'vue';

/** Passes `app` to the default export of the renderer's `appEntrypoint`, when there is one. */
export async function setup(app: App<Element>): Promise<void> {
	if (!loadAppEntrypoint) return;
	const mod = await loadAppEntrypoint();
	if (mod.default) {
		await mod.default(app);
	} else if (import.meta.env.DEV) {
		console.warn(
			'[@astrojs/vue] appEntrypoint does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.',
		);
	}
}
