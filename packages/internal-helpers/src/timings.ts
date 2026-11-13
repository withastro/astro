import type { Pluggable, PluggableList, Plugin } from 'unified';

export interface BuildTimingsRecorder {
	record(kind: string, name: string, duration: number, meta?: Record<string, unknown>): void;
}

// Registry-global because each package that records timings may resolve its own copy of this module.
const RECORDER_KEY = Symbol.for('astro.buildTimings');

export function getBuildTimings(): BuildTimingsRecorder | undefined {
	return (globalThis as any)[RECORDER_KEY];
}

export function setBuildTimings(recorder: BuildTimingsRecorder | undefined): void {
	(globalThis as any)[RECORDER_KEY] = recorder;
}

export function recordTiming(
	kind: string,
	name: string,
	duration: number,
	meta?: Record<string, unknown>,
): void {
	getBuildTimings()?.record(kind, name, duration, meta);
}

/** Calls `fn` and reports its elapsed time to `done`, once its promise settles if it returns one. */
export function measure<T>(fn: () => T, done: (elapsed: number) => void): T {
	const start = performance.now();
	const finish = () => done(performance.now() - start);
	let result: T;
	try {
		result = fn();
	} catch (err) {
		finish();
		throw err;
	}
	if (typeof (result as any)?.then === 'function') {
		return Promise.resolve(result).finally(finish) as T;
	}
	finish();
	return result;
}

export function time<T>(
	kind: string,
	name: string,
	fn: () => T,
	meta?: Record<string, unknown>,
): T {
	const recorder = getBuildTimings();
	if (!recorder) return fn();
	return measure(fn, (elapsed) => recorder.record(kind, name, elapsed, meta));
}

// unified merges plugin options by attacher identity, so a plugin must map to one wrapper per name.
const wrappedPlugins = new WeakMap<Plugin<any[], any>, Map<string, Plugin<any[], any>>>();

/** Attributes the time a unified plugin's transformer spends on each file to `name`. */
export function timedPlugin<T extends Plugin<any[], any>>(
	kind: string,
	name: string,
	plugin: T,
): T {
	if (!getBuildTimings() || typeof plugin !== 'function') return plugin;

	let wrappers = wrappedPlugins.get(plugin);
	if (!wrappers) {
		wrappers = new Map();
		wrappedPlugins.set(plugin, wrappers);
	}
	const key = `${kind}:${name}`;
	const cached = wrappers.get(key);
	if (cached) return cached as T;

	const wrapper = function (this: any, ...args: any[]) {
		const transformer = plugin.apply(this, args as any);
		if (typeof transformer !== 'function') return transformer;

		// trough picks callback or promise style from the transformer's arity, so the wrapper must match.
		if (transformer.length >= 3) {
			return function (this: any, tree: any, file: any, next: (...rest: any[]) => void) {
				const start = performance.now();
				return (transformer as any).call(this, tree, file, (...rest: any[]) => {
					recordTiming(kind, name, performance.now() - start);
					next(...rest);
				});
			};
		}

		return function (this: any, tree: any, file: any) {
			return time(kind, name, () => (transformer as any).call(this, tree, file));
		};
	} as unknown as T;

	wrappers.set(key, wrapper);
	return wrapper;
}

/** Names a unified plugin the way its package is usually spelled: `rehypeShiki` reads as `rehype-shiki`. */
export function pluggableName(pluggable: unknown, index: number, fallbackPrefix: string): string {
	const entry = Array.isArray(pluggable) ? pluggable[0] : pluggable;
	if (typeof entry === 'string') return entry;
	if (typeof entry === 'function' && entry.name) {
		return entry.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
	}
	return `${fallbackPrefix} #${index + 1}`;
}

export function timedPluggableList(
	kind: string,
	list: PluggableList,
	fallbackPrefix: string,
): PluggableList {
	if (!getBuildTimings()) return list;

	return list.map((pluggable, index) => {
		const name = pluggableName(pluggable, index, fallbackPrefix);
		if (Array.isArray(pluggable)) {
			const [plugin, ...options] = pluggable;
			if (typeof plugin !== 'function') return pluggable;
			return [timedPlugin(kind, name, plugin as Plugin<any[], any>), ...options] as Pluggable;
		}
		if (typeof pluggable !== 'function') return pluggable;
		return timedPlugin(kind, name, pluggable as Plugin<any[], any>);
	});
}

// Denied rather than allow-listed, so node types added later are still measured.
const VISITOR_NON_SUBSCRIPTION_KEYS = new Set(['name', 'options']);

function timedVisitFn(kind: string, name: string, visit: (...args: any[]) => any) {
	return function (this: any, node: any, ctx: any) {
		return time(kind, name, () => visit.call(this, node, ctx));
	};
}

function timedVisitor(kind: string, name: string, subscription: any): any {
	if (Array.isArray(subscription)) {
		return subscription.map((entry) => timedVisitor(kind, name, entry));
	}
	if (typeof subscription === 'function') return timedVisitFn(kind, name, subscription);
	if (typeof subscription?.visit === 'function') {
		return { ...subscription, visit: timedVisitFn(kind, name, subscription.visit) };
	}
	return subscription;
}

function timedVisitorPlugin(kind: string, entry: any): any {
	if (Array.isArray(entry)) return entry.map((child) => timedVisitorPlugin(kind, child));
	// A function is a factory that yields the actual entry once per compile.
	if (typeof entry === 'function') return (ctx: unknown) => timedVisitorPlugin(kind, entry(ctx));
	if (!entry || typeof entry !== 'object') return entry;

	// Copying a class instance would drop its prototype methods.
	const prototype = Object.getPrototypeOf(entry);
	if (prototype !== Object.prototype && prototype !== null) return entry;

	const name = typeof entry.name === 'string' ? entry.name : 'plugin';
	const wrapped: Record<string, any> = { ...entry };
	for (const key of Object.keys(entry)) {
		if (VISITOR_NON_SUBSCRIPTION_KEYS.has(key)) continue;
		wrapped[key] = timedVisitor(kind, name, entry[key]);
	}
	return wrapped;
}

/** Attributes the time a Sätteri mdast/hast plugin spends in its visitors to its own name. */
export function timedVisitorPlugins<T>(kind: string, entries: readonly T[]): T[] {
	if (!getBuildTimings()) return entries as T[];
	return entries.map((entry) => timedVisitorPlugin(kind, entry));
}
