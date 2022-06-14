import type { BinaryLike } from 'node:crypto';
import { createHash, randomBytes } from 'node:crypto';

import { isCI } from 'ci-info';
import debug from 'debug';
// @ts-ignore
import gitUp from 'git-up';

import { getAnonymousMeta } from './anonymous-meta.js';
import { Config } from './config.js';
import * as KEY from './keys.js';
import { post } from './post.js';
import { getRawProjectId } from './project-id.js';

export interface AstroTelemetryOptions {
	version: string;
}

export type TelemetryEvent = { eventName: string; payload: Record<string, any> };

interface EventContext {
	anonymousId: string;
	projectId: string;
	projectMetadata: any;
	sessionId: string;
}

export class AstroTelemetry {
	private rawProjectId = getRawProjectId();
	private sessionId = randomBytes(32).toString('hex');
	private config = new Config({
		name: 'astro',
		// Use getter to defer generation of defaults unless needed
		get defaults() {
			return new Map<string, any>([
				[KEY.TELEMETRY_ENABLED, true],
				[KEY.TELEMETRY_SALT, randomBytes(16).toString('hex')],
				[KEY.TELEMETRY_ID, randomBytes(32).toString('hex')],
			]);
		},
	});
	private debug = debug('astro:telemetry');

	private get astroVersion() {
		return this.opts.version;
	}
	private get ASTRO_TELEMETRY_DISABLED() {
		return process.env.ASTRO_TELEMETRY_DISABLED;
	}
	private get TELEMETRY_DISABLED() {
		return process.env.TELEMETRY_DISABLED;
	}

	constructor(private opts: AstroTelemetryOptions) {
		// TODO: When the process exits, flush any queued promises
		// This line caused a "cannot exist astro" error, needs to be revisited.
		// process.on('SIGINT', () => this.flush());
	}

	// Util to get value from config or set it if missing
	private getWithFallback<T>(key: string, value: T): T {
		const val = this.config.get(key);
		if (val) {
			return val;
		}
		this.config.set(key, value);
		return value;
	}

	private get salt(): string {
		return this.getWithFallback(KEY.TELEMETRY_SALT, randomBytes(16).toString('hex'));
	}
	private get enabled(): boolean {
		return this.getWithFallback(KEY.TELEMETRY_ENABLED, true);
	}
	private get anonymousId(): string {
		return this.getWithFallback(KEY.TELEMETRY_ID, randomBytes(32).toString('hex'));
	}
	private get notifyDate(): string {
		return this.getWithFallback(KEY.TELEMETRY_NOTIFY_DATE, '');
	}

	private hash(payload: BinaryLike): string {
		const hash = createHash('sha256');
		hash.update(payload);
		return hash.digest('hex');
	}

	// Create a ONE-WAY hash so there is no way for Astro to decode the value later.
	private oneWayHash(payload: BinaryLike): string {
		const hash = createHash('sha256');
		// Always prepend the payload value with salt! This ensures the hash is one-way.
		hash.update(this.salt);
		hash.update(payload);
		return hash.digest('hex');
	}

	// Instead of sending `rawProjectId`, we only ever reference a hashed value *derived*
	// from `rawProjectId`. This ensures that `projectId` is ALWAYS anonymous and can't
	// be reversed from the hashed value.
	private get projectId(): string {
		return this.oneWayHash(this.rawProjectId);
	}

	private get projectMetadata(): undefined | { owner: string; name: string } {
		const projectId = this.rawProjectId;
		if (projectId === process.cwd()) {
			return;
		}
		const { pathname, resource } = gitUp(projectId);
		const parts = pathname.split('/').slice(1);
		const owner = `${resource}${parts[0]}`;
		const name = parts[1].replace('.git', '');
		return { owner: this.hash(owner), name: this.hash(name) };
	}

	private get isDisabled(): boolean {
		if (Boolean(this.ASTRO_TELEMETRY_DISABLED || this.TELEMETRY_DISABLED)) {
			return true;
		}
		return this.enabled === false;
	}

	setEnabled(value: boolean) {
		this.config.set(KEY.TELEMETRY_ENABLED, value);
	}

	clear() {
		return this.config.clear();
	}

	private queue: Promise<any>[] = [];

	// Wait for any in-flight promises to resolve
	private async flush() {
		await Promise.all(this.queue);
	}

	async notify(callback: () => Promise<boolean>) {
		if (this.isDisabled || isCI) {
			return;
		}
		// The end-user has already been notified about our telemetry integration!
		// Don't bother them about it again.
		// In the event of significant changes, we should invalidate old dates.
		if (this.notifyDate) {
			return;
		}
		const enabled = await callback();
		this.config.set(KEY.TELEMETRY_NOTIFY_DATE, Date.now().toString());
		this.config.set(KEY.TELEMETRY_ENABLED, enabled);
	}

	async record(event: TelemetryEvent | TelemetryEvent[] = []) {
		const events: TelemetryEvent[] = Array.isArray(event) ? event : [event];
		if (events.length < 1) {
			return Promise.resolve();
		}

		if (this.debug.enabled) {
			// Print to standard error to simplify selecting the output
			events.forEach(({ eventName, payload }) =>
				this.debug(JSON.stringify({ eventName, payload }, null, 2))
			);
			// Do not send the telemetry data if debugging. Users may use this feature
			// to preview what data would be sent.
			return Promise.resolve();
		}

		// Skip recording telemetry if the feature is disabled
		if (this.isDisabled) {
			return Promise.resolve();
		}

		const context: EventContext = {
			anonymousId: this.anonymousId,
			projectId: this.projectId,
			projectMetadata: this.projectMetadata,
			sessionId: this.sessionId,
		};
		const meta = getAnonymousMeta(this.astroVersion);

		const req = post({
			context,
			meta,
			events,
		}).then(() => {
			this.queue = this.queue.filter((r) => r !== req);
		});
		this.queue.push(req);
		return req;
	}
}
