import type { ClientDirective } from '../../@types/astro';

const loadDirective: ClientDirective = async (load) => {
	const hydrate = await load();
	await hydrate();
};

export default loadDirective;
