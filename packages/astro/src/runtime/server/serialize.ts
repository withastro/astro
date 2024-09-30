import { uneval } from 'devalue';

export function serializeProps(props: Record<string, unknown>, componentName: string) {
	// Remove symbolic keys as devalue can't handle them and they don't really make sense to be
	// serialized as symbolic keys aren't really equal between the client and server realms
	if (Object.getOwnPropertySymbols(props).length) {
		props = Object.fromEntries(Object.entries(props).filter(([key]) => typeof key !== 'symbol'));
	}
	try {
		return uneval(props);
	} catch (e) {
		throw new Error(`Unable to serialize props for <${componentName} />`, { cause: e });
	}
}
