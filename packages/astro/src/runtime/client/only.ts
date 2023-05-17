import type { ClientDirective } from '../../@types/astro';

/**
 * Hydrate this component only on the client
 */
const onlyDirective: ClientDirective = async (load) => {
	const hydrate = await load();
	await hydrate();
};

export default onlyDirective;
