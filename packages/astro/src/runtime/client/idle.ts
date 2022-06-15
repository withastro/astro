import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { notify } from './events';

/**
 * Hydrate this component as soon as the main thread is free
 * (or after a short delay, if `requestIdleCallback`) isn't supported
 */
export default async function onIdle(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	async function idle() {
		const cb = async () => {
			let hydrate = await getHydrateCallback();
			await hydrate();
			notify();
		};

		if ('requestIdleCallback' in window) {
			(window as any).requestIdleCallback(cb);
		} else {
			setTimeout(cb, 200);
		}
	}
	idle();
}
