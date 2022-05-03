import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component when one of it's children becomes visible.
 * We target the children because `astro-island` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
export default async function onVisible(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let innerHTML: string | null = null;
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

	const cb = async () => {
		const hydrate = await getHydrateCallback();
		hydrate(root, innerHTML);
	};

	const io = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			// As soon as we hydrate, disconnect this IntersectionObserver for every `astro-island`
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
