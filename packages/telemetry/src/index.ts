import { randomBytes } from 'node:crypto';
import { isCI } from 'ci-info';
import { GlobalConfig } from './config.js';
import * as KEY from './config-keys.js';
import { post } from './post.js';
import { getProjectInfo, type ProjectInfo } from './project-info.js';
import { getSystemInfo, type SystemInfo } from './system-info.js';

export type AstroTelemetryOptions = { astroVersion: string; viteVersion: string };
export type TelemetryEvent = { eventName: string; payload: Record<string, any> };

// In the event of significant policy changes, update this!
const VALID_TELEMETRY_NOTICE_DATE = '2023-08-25';

/**
 * Get the debug function from global (set by astro's logger)
 */
function getDebug(): ((type: string, ...args: any[]) => void) | undefined {
	return (globalThis as any)._astroGlobalDebug;
}

type EventMeta = SystemInfo;
interface EventContext extends ProjectInfo {
	anonymousId: string;
	anonymousSessionId: string;
}
export class AstroTelemetry {
	private _anonymousSessionId: string | undefined;
	private _anonymousProjectInfo: ProjectInfo | undefined;
	private config = new GlobalConfig({ name: 'astro' });
	private isCI = isCI;
	private env = process.env;

	private get astroVersion() {
		return this.opts.astroVersion;
	}
	private get viteVersion() {
		return this.opts.viteVersion;
	}
	private get ASTRO_TELEMETRY_DISABLED() {
		return this.env.ASTRO_TELEMETRY_DISABLED;
	}
	private get TELEMETRY_DISABLED() {
		return this.env.TELEMETRY_DISABLED;
	}

	constructor(private opts: AstroTelemetryOptions) {
		// TODO: When the process exits, flush any queued promises
		// This caused a "cannot exist astro" error when it ran, so it was removed.
		// process.on('SIGINT', () => this.flush());
	}

	/**
	 * Get value from either the global config or the provided fallback.
	 * If value is not set, the fallback is saved to the global config,
	 * persisted for later sessions.
	 */
	private getConfigWithFallback<T>(key: string, getValue: () => T): T {
		const currentValue = this.config.get(key);
		if (currentValue !== undefined) {
			return currentValue;
		}
		const newValue = getValue();
		this.config.set(key, newValue);
		return newValue;
	}

	private get enabled(): boolean {
		return this.getConfigWithFallback(KEY.TELEMETRY_ENABLED, () => true);
	}

	private get notifyDate(): string {
		return this.getConfigWithFallback(KEY.TELEMETRY_NOTIFY_DATE, () => '');
	}

	private get anonymousId(): string {
		return this.getConfigWithFallback(KEY.TELEMETRY_ID, () => randomBytes(32).toString('hex'));
	}

	private get anonymousSessionId(): string {
		// NOTE(fks): this value isn't global, so it can't use getConfigWithFallback().
		this._anonymousSessionId = this._anonymousSessionId || randomBytes(32).toString('hex');
		return this._anonymousSessionId;
	}

	private get anonymousProjectInfo(): ProjectInfo {
		// NOTE(fks): this value isn't global, so it can't use getConfigWithFallback().
		this._anonymousProjectInfo = this._anonymousProjectInfo || getProjectInfo(this.isCI);
		return this._anonymousProjectInfo;
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

	isValidNotice() {
		if (!this.notifyDate) return false;
		const current = Number(this.notifyDate);
		const valid = new Date(VALID_TELEMETRY_NOTICE_DATE).valueOf();

		return current > valid;
	}

	async notify(callback: () => boolean | Promise<boolean>) {
		const debug = getDebug();
		if (this.isDisabled || this.isCI) {
			debug?.('telemetry', `[notify] telemetry has been disabled`);
			return;
		}
		// The end-user has already been notified about our telemetry integration!
		// Don't bother them about it again.
		if (this.isValidNotice()) {
			debug?.('telemetry', `[notify] last notified on ${this.notifyDate}`);
			return;
		}
		const enabled = await callback();
		this.config.set(KEY.TELEMETRY_NOTIFY_DATE, new Date().valueOf().toString());
		this.config.set(KEY.TELEMETRY_ENABLED, enabled);
		debug?.('telemetry', `[notify] telemetry has been ${enabled ? 'enabled' : 'disabled'}`);
	}

	async record(event: TelemetryEvent | TelemetryEvent[] = []) {
		const events: TelemetryEvent[] = Array.isArray(event) ? event : [event];
		if (events.length < 1) {
			return Promise.resolve();
		}

		const debug = getDebug();

		// Skip recording telemetry if the feature is disabled
		if (this.isDisabled) {
			debug?.('telemetry', '[record] telemetry has been disabled');
			return Promise.resolve();
		}

		const meta: EventMeta = {
			...getSystemInfo({ astroVersion: this.astroVersion, viteVersion: this.viteVersion }),
		};

		const context: EventContext = {
			...this.anonymousProjectInfo,
			anonymousId: this.anonymousId,
			anonymousSessionId: this.anonymousSessionId,
		};

		// Every CI session also creates a new user, which blows up telemetry.
		// To solve this, we track all CI runs under a single "CI" anonymousId.
		if (meta.isCI) {
			context.anonymousId = `CI.${meta.ciName || 'UNKNOWN'}`;
		}

		// Check if debug is enabled by trying to call it - if DEBUG is not set, nothing happens
		const debugOutput =
			process.env.DEBUG?.includes('astro:telemetry') ||
			process.env.DEBUG?.includes('astro:*') ||
			process.env.DEBUG === '*';
		if (debugOutput && debug) {
			// Print to standard error to simplify selecting the output
			debug('telemetry', { context, meta });
			debug('telemetry', JSON.stringify(events, null, 2));
			// Do not send the telemetry data if debugging. Users may use this feature
			// to preview what data would be sent.
			return Promise.resolve();
		}
		return post({
			context,
			meta,
			events,
		}).catch((err) => {
			// Log the error to the debugger, but otherwise do nothing.
			debug?.('telemetry', `Error sending event: ${err.message}`);
		});
	}
}
