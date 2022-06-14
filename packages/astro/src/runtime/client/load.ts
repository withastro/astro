import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { notify } from './events';

/**
 * Hydrate this component immediately
 */
export default async function onLoad(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	async function load() {
		let hydrate = await getHydrateCallback();
		await hydrate();
		notify();
	}
	load();
}
