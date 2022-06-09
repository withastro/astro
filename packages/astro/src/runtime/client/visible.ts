import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';
import { listen, notify } from './events';

/**
 * Hydrate this component when one of it's children becomes visible
 * We target the children because `astro-root` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
export default async function onVisible(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let io: IntersectionObserver;
	let innerHTML: string | null = null;
	let hydrate: Awaited<ReturnType<GetHydrateCallback>>;

	async function visible() {
		listen(visible);
		const cb = async () => {
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
		};

		if (io) {
			io.disconnect();
		}

		io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				// As soon as we hydrate, disconnect this IntersectionObserver for every `astro-root`
				io.disconnect();
				cb();
				break; // break loop on first match
			}
		});

		for (let i = 0; i < root.children.length; i++) {
			const child = root.children[i];
			io.observe(child);
		}
	}

	visible();
}
