/**
 * Per-request render options passed from BaseApp.render() into the Hono
 * middleware pipeline via a simple synchronous store. This avoids smuggling
 * values on the Request object (which breaks when Requests are cloned for
 * rewrites).
 *
 * The store is attached to a global Symbol so that the same instance is
 * shared even when the module is duplicated across bundles (e.g. the
 * adapter's runtime App import vs. the bundled fixture/server code).
 */
interface RenderOptions {
	locals?: App.Locals;
	clientAddress?: string;
	addCookieHeader?: boolean;
	prerenderedErrorPageFetch?: ((url: string) => Promise<Response>) | undefined;
}

interface RenderOptionsStore {
	run<R>(store: RenderOptions, callback: () => R): R;
	getStore(): RenderOptions | undefined;
}

function createSyncStore(): RenderOptionsStore {
	let current: RenderOptions | undefined;
	return {
		run<R>(store: RenderOptions, callback: () => R): R {
			const prev = current;
			current = store;
			try {
				const result = callback();
				// Handle async callbacks: keep the store active until the
				// promise settles, then restore the previous value.
				if (result && typeof (result as any).then === 'function') {
					return (result as any).then(
						(v: any) => { current = prev; return v; },
						(e: any) => { current = prev; throw e; },
					);
				}
				current = prev;
				return result;
			} catch (e) {
				current = prev;
				throw e;
			}
		},
		getStore() {
			return current;
		},
	};
}

const key = Symbol.for('astro.renderOptionsStore');
const g = globalThis as Record<symbol, unknown>;
export const renderOptionsStore: RenderOptionsStore =
	(g[key] as RenderOptionsStore) ?? (g[key] = createSyncStore());
