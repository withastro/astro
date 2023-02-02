import type { Plugin as VitePlugin } from 'vite';

// eslint-disable-next-line @typescript-eslint/ban-types
type OutputOptionsHook = Extract<VitePlugin['outputOptions'], Function>;
type OutputOptions = Parameters<OutputOptionsHook>[0];

type ExtendManualChunksHooks = {
	before?: (id: string, meta: any) => string | undefined;
	after?: (id: string, meta: any) => string | undefined;
}

export function extendManualChunks(outputOptions: OutputOptions, hooks: ExtendManualChunksHooks) {
	const manualChunks = outputOptions.manualChunks;
	outputOptions.manualChunks = function(id, meta) {
		if(hooks.before) {
			let value = hooks.before(id, meta);
			if(value) {
				return value;
			}
		}

		// Defer to user-provided `manualChunks`, if it was provided.
		if (typeof manualChunks == 'object') {
			if (id in manualChunks) {
				let value = manualChunks[id];
				return value[0];
			}
		} else if (typeof manualChunks === 'function') {
			const outid = manualChunks.call(this, id, meta);
			if (outid) {
				return outid;
			}
		}
		
		if(hooks.after) {
			return hooks.after(id, meta) || null;
		}
		return null;
	};
}
