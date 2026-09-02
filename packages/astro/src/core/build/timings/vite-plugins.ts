import type * as vite from 'vite';
import type { BuildTimingsCollector } from './collector.js';

const INSTRUMENTED = Symbol.for('astro.buildTimings.instrumented');

const TIMED_HOOKS = [
	'resolveId',
	'load',
	'transform',
	'renderChunk',
	'generateBundle',
	'writeBundle',
	'buildStart',
	'buildEnd',
	'closeBundle',
] as const;

/** Argument position holding the module id, for the hooks that receive one. */
const MODULE_ARGUMENT: Record<string, number> = { load: 0, transform: 1 };

/** Context methods that run other plugins' hooks, whose time belongs to them and not the caller. */
const DELEGATING_CONTEXT_METHODS = ['resolve', 'load'] as const;

interface HookFrame {
	delegated: number;
}

function measureDelegation(frame: HookFrame, call: () => any): any {
	const start = performance.now();
	const charge = () => {
		frame.delegated += performance.now() - start;
	};

	let result: any;
	try {
		result = call();
	} catch (err) {
		charge();
		throw err;
	}
	if (result && typeof result.then === 'function') {
		return result.then(
			(value: unknown) => {
				charge();
				return value;
			},
			(err: unknown) => {
				charge();
				throw err;
			},
		);
	}
	charge();
	return result;
}

/** Keeps a hook that awaits `this.resolve()` from being charged for the chain beneath it. */
function delegationTrackingContext(context: any, frame: HookFrame): any {
	if (!context || typeof context !== 'object') return context;

	let tracked: any;
	for (const method of DELEGATING_CONTEXT_METHODS) {
		const original = context[method];
		if (typeof original !== 'function') continue;
		tracked ??= Object.create(context);
		tracked[method] = (...args: any[]) =>
			measureDelegation(frame, () => original.apply(context, args));
	}
	return tracked ?? context;
}

function timeHandler(
	collector: BuildTimingsCollector,
	pluginName: string,
	hookName: string,
	handler: (...args: any[]) => any,
) {
	const moduleArgument = MODULE_ARGUMENT[hookName];

	return function (this: any, ...args: any[]) {
		const start = performance.now();
		const frame: HookFrame = { delegated: 0 };
		const moduleId = moduleArgument === undefined ? undefined : args[moduleArgument];
		const done = () => {
			const elapsed = performance.now() - start - frame.delegated;
			collector.record('vite-hook', pluginName, Math.max(elapsed, 0), {
				hook: hookName,
				module: typeof moduleId === 'string' ? moduleId : undefined,
			});
		};

		let result: any;
		try {
			result = handler.apply(delegationTrackingContext(this, frame), args);
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

function instrumentPlugin(collector: BuildTimingsCollector, plugin: vite.Plugin): vite.Plugin {
	const target = plugin as any;
	if (target[INSTRUMENTED] || Object.isFrozen(plugin)) return plugin;

	const pluginName = plugin.name ?? 'anonymous';
	for (const hookName of TIMED_HOOKS) {
		const hook = target[hookName];
		if (!hook) continue;
		try {
			if (typeof hook === 'function') {
				target[hookName] = timeHandler(collector, pluginName, hookName, hook);
			} else if (typeof hook === 'object' && typeof hook.handler === 'function') {
				target[hookName] = {
					...hook,
					handler: timeHandler(collector, pluginName, hookName, hook.handler),
				};
			}
		} catch {
			// A plugin that refuses the assignment is simply left unmeasured.
		}
	}
	target[INSTRUMENTED] = true;
	return plugin;
}

/** Attributes plugin hook cost per plugin, per hook, and — for `load`/`transform` — per module. */
function instrumentVitePlugins(
	collector: BuildTimingsCollector,
	plugins: vite.PluginOption,
): vite.PluginOption {
	if (!plugins) return plugins;
	if (Array.isArray(plugins)) {
		return plugins.map((plugin) => instrumentVitePlugins(collector, plugin));
	}
	if (typeof (plugins as Promise<unknown>).then === 'function') {
		return (plugins as Promise<vite.PluginOption>).then((plugin) =>
			instrumentVitePlugins(collector, plugin),
		) as vite.PluginOption;
	}
	return instrumentPlugin(collector, plugins as vite.Plugin);
}

export function instrumentViteConfig(
	collector: BuildTimingsCollector,
	config: vite.InlineConfig,
): vite.InlineConfig {
	return {
		...config,
		plugins: instrumentVitePlugins(collector, config.plugins) as vite.PluginOption[],
	};
}
