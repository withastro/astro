export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export type MaybePromise<T> = T | Promise<T>;

export async function getAction(pathKeys: string[]): Promise<(...args: unknown[]) => MaybePromise<unknown>> {
	let { default: actionLookup } = await import(import.meta.env.ACTIONS_PATH);
	for (const key of pathKeys) {
		if (!(key in actionLookup)) {
			throw new Error('Action not found');
		}
		actionLookup = actionLookup[key];
	}
	if (typeof actionLookup !== 'function') {
		throw new Error('Action not found');
	}
	return actionLookup;
}
