import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { listen, notify } from './events';

/**
 * Hydrate this component only on the client
 */
export default async function onOnly(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let innerHTML: string | null = null;
	let hydrate: Awaited<ReturnType<GetHydrateCallback>>;

	async function only() {
		listen(only);
		if (typeof innerHTML !== 'string') {
			let fragment = root.querySelector(`astro-fragment`);
			if (fragment == null && root.hasAttribute('tmpl')) {
				// If there is no child fragment, check to see if there is a template.
				// This happens if children were passed but the client component did not render any.
				let template = root.querySelector(`template[data-astro-template]`);
				if (template) {
					innerHTML = template.innerHTML;
					template.remove();
				}
			} else if (fragment) {
				innerHTML = fragment.innerHTML;
			}
		}
		if (!hydrate) {
			hydrate = await getHydrateCallback();
		}
		if (!root.parentElement?.closest('astro-island[ssr]')) {
			await hydrate(root, innerHTML);
			root.removeAttribute('ssr');
		}
		notify();
	}
	only();
}
