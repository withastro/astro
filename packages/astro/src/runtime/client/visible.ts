import type { ClientDirective } from '../../@types/astro';

/**
 * Hydrate this component when one of it's children becomes visible
 * We target the children because `astro-island` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
const visibleDirective: ClientDirective = (load, _options, el) => {
	const cb = async () => {
		const hydrate = await load();
		await hydrate();
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

	for (const child of el.children) {
		io.observe(child);
	}
};

export default visibleDirective;
