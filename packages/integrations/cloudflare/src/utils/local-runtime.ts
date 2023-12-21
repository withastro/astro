import type {
	D1Database,
	DurableObjectNamespace,
	IncomingRequestCfProperties,
	KVNamespace,
	R2Bucket,
} from '@cloudflare/workers-types/experimental';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import type { Json, ReplaceWorkersTypes, WorkerOptions } from 'miniflare';
import type { Options } from '../index.js';

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import TOML from '@iarna/toml';
import { AstroError } from 'astro/errors';
import dotenv from 'dotenv';
import { Miniflare } from 'miniflare';

interface NodeJSError extends Error {
	code?: string;
}

type BASE_RUNTIME = {
	mode: 'local';
	type: 'pages' | 'workers';
	persistTo: string;
	bindings: Record<
		string,
		| { type: 'var'; value: string | Json }
		| { type: 'kv' }
		| { type: 'r2' }
		| {
				type: 'd1';
		  }
		| {
				type: 'durable-object';
				className: string;
				service?: {
					name: string;
					env?: string;
				};
		  }
	>;
};

export type RUNTIME =
	| {
			mode: BASE_RUNTIME['mode'];
			type: 'pages';
			persistTo: BASE_RUNTIME['persistTo'];
			bindings: BASE_RUNTIME['bindings'];
	  }
	| {
			mode: BASE_RUNTIME['mode'];
			type: 'workers';
			persistTo: BASE_RUNTIME['persistTo'];
	  };

class LocalRuntime {
	private _astroConfig: AstroConfig;
	private _logger: AstroIntegrationLogger;
	private _miniflare: Miniflare;

	private miniflareBindings:
		| Record<
				string,
				| D1Database
				| ReplaceWorkersTypes<R2Bucket>
				| ReplaceWorkersTypes<KVNamespace>
				| ReplaceWorkersTypes<DurableObjectNamespace>
				| Json
		  >
		| undefined;
	private secrets: Record<string, string> | undefined;
	private cfObject: IncomingRequestCfProperties | undefined;

	public constructor(
		astroConfig: AstroConfig,
		runtimeConfig: BASE_RUNTIME,
		logger: AstroIntegrationLogger
	) {
		this._astroConfig = astroConfig;
		this._logger = logger;

		const varBindings: Required<Pick<WorkerOptions, 'bindings'>>['bindings'] = {};
		const kvBindings: Required<Pick<WorkerOptions, 'kvNamespaces'>>['kvNamespaces'] = [];
		const d1Bindings: Required<Pick<WorkerOptions, 'd1Databases'>>['d1Databases'] = [];
		const r2Bindings: Required<Pick<WorkerOptions, 'r2Buckets'>>['r2Buckets'] = [];
		const durableObjectBindings: Required<Pick<WorkerOptions, 'durableObjects'>>['durableObjects'] =
			{};

		for (const bindingName in runtimeConfig.bindings) {
			const bindingData = runtimeConfig.bindings[bindingName];
			switch (bindingData.type) {
				case 'var':
					varBindings[bindingName] = bindingData.value;
					break;
				case 'kv':
					kvBindings.push(bindingName);
					break;
				case 'd1':
					d1Bindings.push(bindingName);
					break;
				case 'r2':
					r2Bindings.push(bindingName);
					break;
				case 'durable-object':
					durableObjectBindings[bindingName] = {
						className: bindingData.className,
						scriptName: bindingData.service?.name,
					};
					break;
			}
		}

		this._miniflare = new Miniflare({
			cachePersist: `${runtimeConfig.persistTo}/cache`,
			d1Persist: `${runtimeConfig.persistTo}/d1`,
			r2Persist: `${runtimeConfig.persistTo}/r2`,
			kvPersist: `${runtimeConfig.persistTo}/kv`,
			durableObjectsPersist: `${runtimeConfig.persistTo}/do`,
			workers: [
				{
					name: 'worker',
					script: '',
					modules: true,
					cacheWarnUsage: true,
					cache: true,
					bindings: varBindings,
					d1Databases: d1Bindings,
					r2Buckets: r2Bindings,
					kvNamespaces: kvBindings,
					durableObjects: durableObjectBindings,
				},
			],
		});
	}

	public async getBindings() {
		await this._miniflare.ready;
		if (!this.miniflareBindings) {
			this.miniflareBindings = await this._miniflare.getBindings();
		}
		return this.miniflareBindings;
	}

	public async getSecrets() {
		await this._miniflare.ready;
		if (!this.secrets) {
			try {
				this.secrets = dotenv.parse(
					readFileSync(fileURLToPath(new URL('./.dev.vars', this._astroConfig.root)))
				);
			} catch (error) {
				const e = error as NodeJSError;
				if (e.code === 'ENOENT') {
					this._logger.info(
						'There is no `.dev.vars` file in the root directory, if you have encrypted secrets or environmental variables you Cloudflare recommends to put them in this file'
					);
					this.secrets = {};
				} else {
					throw new AstroError('Failed to load secrets file', e.message);
				}
			}
		}
		return this.secrets;
	}

	public async getCaches() {
		await this._miniflare.ready;
		return this._miniflare.getCaches();
	}

	public async getCF() {
		await this._miniflare.ready;

		const MAX_CACHE_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days;
		// Try load cached cfObject, if this fails, we'll catch the error and refetch.
		// If this succeeds, and the file is stale, that's fine: it's very likely
		// we'll be fetching the same data anyways.
		try {
			const cachedCFObject = JSON.parse(
				readFileSync(fileURLToPath(new URL('cf.json', this._astroConfig.cacheDir)), 'utf8')
			);
			const cfObjectStats = statSync(fileURLToPath(new URL('cf.json', this._astroConfig.cacheDir)));
			assert(Date.now() - cfObjectStats.mtimeMs <= MAX_CACHE_AGE);
			this.cfObject = cachedCFObject;
		} catch {}

		const CF_ENDPOINT = 'https://workers.cloudflare.com/cf.json';
		if (!this.cfObject) {
			this.cfObject = await fetch(CF_ENDPOINT).then((res) => res.json());
			mkdirSync(this._astroConfig.cacheDir);
			writeFileSync(
				fileURLToPath(new URL('cf.json', this._astroConfig.cacheDir)),
				JSON.stringify(this.cfObject),
				'utf8'
			);
		}
		return this.cfObject;
	}

	public async dispose() {
		await this._miniflare.dispose();
	}
}

export class LocalWorkersRuntime extends LocalRuntime {
	constructor(
		astroConfig: AstroConfig,
		runtimeConfig: Extract<RUNTIME, { type: 'workers' }>,
		logger: AstroIntegrationLogger
	) {
		let _wranglerConfig: CF_RawConfig | undefined;
		try {
			_wranglerConfig = TOML.parse(
				readFileSync(fileURLToPath(new URL('./wrangler.toml', astroConfig.root)), 'utf-8').replace(
					/\r\n/g,
					'\n'
				)
			) as unknown as CF_RawConfig;
		} catch (error) {
			const e = error as NodeJSError;
			if (e.code === 'ENOENT') {
				logger.error('Missing file `wrangler.toml in root directory`');
			} else {
				throw new AstroError('Failed to load wrangler config', e.message);
			}
		}
		const runtimeConfigWithWrangler: BASE_RUNTIME = {
			...runtimeConfig,
			bindings: {},
		};
		if (_wranglerConfig?.vars) {
			for (const key in _wranglerConfig.vars) {
				runtimeConfigWithWrangler.bindings[key] = {
					type: 'var',
					value: _wranglerConfig.vars[key],
				};
			}
		}
		if (_wranglerConfig?.kv_namespaces) {
			for (const ns of _wranglerConfig.kv_namespaces) {
				runtimeConfigWithWrangler.bindings[ns.binding] = {
					type: 'kv',
				};
			}
		}
		if (_wranglerConfig?.d1_databases) {
			for (const db of _wranglerConfig.d1_databases) {
				runtimeConfigWithWrangler.bindings[db.binding] = {
					type: 'd1',
				};
			}
		}
		if (_wranglerConfig?.r2_buckets) {
			for (const bucket of _wranglerConfig.r2_buckets) {
				runtimeConfigWithWrangler.bindings[bucket.binding] = {
					type: 'r2',
				};
			}
		}
		if (_wranglerConfig?.durable_objects) {
			for (const durableObject of _wranglerConfig.durable_objects.bindings) {
				runtimeConfigWithWrangler.bindings[durableObject.name] = {
					type: 'durable-object',
					className: durableObject.class_name,
					service: durableObject.script_name
						? {
								name: durableObject.script_name,
						  }
						: undefined,
				};
			}
		}

		super(astroConfig, runtimeConfigWithWrangler, logger);
	}
}

export class LocalPagesRuntime extends LocalRuntime {
	// biome-ignore lint/complexity/noUselessConstructor: not types information yet, so we need to disable the rule for the time being
	public constructor(
		astroConfig: AstroConfig,
		runtimeConfig: Extract<RUNTIME, { type: 'pages' }>,
		logger: AstroIntegrationLogger
	) {
		super(astroConfig, runtimeConfig, logger);
	}
}

let localRuntime: LocalPagesRuntime | LocalWorkersRuntime | undefined;
export function getLocalRuntime(
	astroConfig: AstroConfig,
	runtimeConfig: RUNTIME,
	logger: AstroIntegrationLogger
): LocalPagesRuntime | LocalWorkersRuntime {
	if (localRuntime) return localRuntime;

	if (runtimeConfig.type === 'pages') {
		localRuntime = new LocalPagesRuntime(astroConfig, runtimeConfig, logger);
	} else {
		localRuntime = new LocalWorkersRuntime(astroConfig, runtimeConfig, logger);
	}

	return localRuntime;
}

export function getRuntimeConfig(userConfig?: Options['runtime']): { mode: 'off' } | RUNTIME {
	if (!userConfig || userConfig.mode === 'off') return { mode: 'off' };

	// we know that we have `mode: local` below
	if (userConfig.type === 'pages')
		return {
			mode: 'local',
			type: 'pages',
			persistTo: userConfig.persistTo ?? '.wrangler/state/v3',
			bindings: userConfig.bindings ?? {},
		};

	// we know that we have `type: workers` below
	return {
		mode: 'local',
		type: 'workers',
		persistTo: userConfig.persistTo ?? '.wrangler/state/v3',
	};
}
