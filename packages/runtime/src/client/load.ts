import type { ClientDirective } from '../types.js';

const loadDirective: ClientDirective = async (load) => {
	const hydrate = await load();
	await hydrate();
};

export default loadDirective;
