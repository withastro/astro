import type {ClientDirective} from '../../@types/astro';

const loadDirective: ClientDirective = async (load, options) => {
	if (options.value === "dom") {
		window.addEventListener('DOMContentLoaded', async () => {
			const hydrate = await load();
			await hydrate();
		})
	} else {
		const hydrate = await load();
		await hydrate();
	}
};

export default loadDirective;
