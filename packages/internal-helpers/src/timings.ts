import type { Pluggable, PluggableList, Plugin } from 'unified';

/** Sink for build timing measurements, installed only for the duration of `astro build --timings`. */
export interface BuildTimingsRecorder {
	record(kind: string, name: string, duration: number, meta?: Record<string, unknown>): void;
}

// Registry-global because the packages that record timings may each resolve their own copy of this one.
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

export async function timeAsync<T>(
	kind: string,
	name: string,
	fn: () => T | Promise<T>,
	meta?: Record<string, unknown>,
): Promise<T> {
	const recorder = getBuildTimings();
	if (!recorder) return fn();
	const start = performance.now();
	try {
		return await fn();
	} finally {
		recorder.record(kind, name, performance.now() - start, meta);
	}
}

export function timeSync<T>(
	kind: string,
	name: string,
	fn: () => T,
	meta?: Record<string, unknown>,
): T {
	const recorder = getBuildTimings();
	if (!recorder) return fn();
	const start = performance.now();
	try {
		return fn();
	} finally {
		recorder.record(kind, name, performance.now() - start, meta);
	}
}

// unified merges plugin options by attacher identity, so one plugin must map to one wrapper.
const wrappedPlugins = new WeakMap<Plugin<any[], any>, Plugin<any[], any>>();

/** Attributes the time a unified plugin's transformer spends on each file to `name`. */
export function timedPlugin<T extends Plugin<any[], any>>(
	kind: string,
	name: string,
	plugin: T,
): T {
	if (!getBuildTimings() || typeof plugin !== 'function') return plugin;

	const cached = wrappedPlugins.get(plugin);
	if (cached) return cached as T;

	const wrapper = function (this: any, ...args: any[]) {
		const transformer = plugin.apply(this, args as any);
		if (typeof transformer !== 'function') return transformer;

		// trough picks callback vs. promise style from arity, so the wrapper must match it.
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
			const start = performance.now();
			const done = () => recordTiming(kind, name, performance.now() - start);
			let result: any;
			try {
				result = (transformer as any).call(this, tree, file);
			} catch (err) {
				done();
				throw err;
			}
			if (result && typeof result.then === 'function') {
				return result.then(
					(value: unknown) => {
						done();
						return value;
					},
					(err: unknown) => {
						done();
						throw err;
					},
				);
			}
			done();
			return result;
		};
	} as unknown as T;

	wrappedPlugins.set(plugin, wrapper);
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

/** Wraps every plugin in a unified plugin list, passing through entries that are not attachers. */
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

// Denied rather than allow-listed, so a node type added later is still measured.
const VISITOR_NON_SUBSCRIPTION_KEYS = new Set(['name', 'options']);

function timedVisitFn(kind: string, name: string, visit: (...args: any[]) => any) {
	return function (this: any, node: any, ctx: any) {
		const recorder = getBuildTimings();
		if (!recorder) return visit.call(this, node, ctx);

		const start = performance.now();
		const done = () => recorder.record(kind, name, performance.now() - start);
		let result: any;
		try {
			result = visit.call(this, node, ctx);
		} catch (err) {
			done();
			throw err;
		}
		if (result && typeof result.then === 'function') {
			return result.then(
				(value: unknown) => {
					done();
					return value;
				},
				(err: unknown) => {
					done();
					throw err;
				},
			);
		}
		done();
		return result;
	};
}

function timedVisitor(kind: string, name: string, subscription: any): any {
	if (!subscription) return subscription;
	if (Array.isArray(subscription)) {
		return subscription.map((entry) => timedVisitor(kind, name, entry));
	}
	if (typeof subscription === 'function') return timedVisitFn(kind, name, subscription);
	if (typeof subscription === 'object' && typeof subscription.visit === 'function') {
		return { ...subscription, visit: timedVisitFn(kind, name, subscription.visit) };
	}
	return subscription;
}

function timedVisitorPlugin(kind: string, entry: any): any {
	if (!entry) return entry;
	if (Array.isArray(entry)) return entry.map((child) => timedVisitorPlugin(kind, child));
	// A function here is a factory that yields the real entry once per compile.
	if (typeof entry === 'function') return (ctx: unknown) => timedVisitorPlugin(kind, entry(ctx));
	if (typeof entry !== 'object') return entry;

	// A copy would drop prototype methods, so anything but a plain object goes unmeasured.
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
