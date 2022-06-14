import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { notify } from './events';

/**
 * Hydrate this component when a matching media query is found
 */
export default async function onMedia(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	async function media() {
		const cb = async () => {
			let hydrate = await getHydrateCallback();
			await hydrate();
			notify();
		};

		if (options.value) {
			const mql = matchMedia(options.value);
			if (mql.matches) {
				cb();
			} else {
				mql.addEventListener('change', cb, { once: true });
			}
		}
	}
	media();
}
