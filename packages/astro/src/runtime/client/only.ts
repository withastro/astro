import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { notify } from './events';

/**
 * Hydrate this component only on the client
 */
export default async function onOnly(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	async function only() {
		let hydrate = await getHydrateCallback();
		await hydrate();
		notify();
	}
	only();
}
