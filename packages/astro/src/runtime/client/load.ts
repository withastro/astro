import type {ClientDirective} from '../../@types/astro';

const loadDirective: ClientDirective = async (load, options) => {
	if (options.value !== "dom" || document.readyState === 'complete' || document.readyState === 'interactive') {
		const hydrate = await load();
		await hydrate();
	} else {
		window.addEventListener('DOMContentLoaded', async () => {
			const hydrate = await load();
			await hydrate();
		})
	}
};

export default loadDirective;
