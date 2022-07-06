import { isCI } from 'ci-info';
import debug from 'debug';
import { randomBytes } from 'node:crypto';
import * as KEY from './config-keys.js';
import { GlobalConfig } from './config.js';
import { post } from './post.js';
import { getProjectInfo, ProjectInfo } from './project-info.js';
import { getSystemInfo, SystemInfo } from './system-info.js';

export type AstroTelemetryOptions = { astroVersion: string; viteVersion: string };
export type TelemetryEvent = { eventName: string; payload: Record<string, any> };
interface EventContext {
	anonymousId: string;
	anonymousProjectId: string;
	anonymousSessionId: string;
}

interface EventMeta extends SystemInfo {
	isGit: boolean;
}
export class AstroTelemetry {
	private _anonymousSessionId: string | undefined;
	private _anonymousProjectInfo: ProjectInfo | undefined;
	private config = new GlobalConfig({ name: 'astro' });
	private debug = debug('astro:telemetry');

	private get astroVersion() {
		return this.opts.astroVersion;
	}
	private get viteVersion() {
		return this.opts.viteVersion;
	}
	private get ASTRO_TELEMETRY_DISABLED() {
		return process.env.ASTRO_TELEMETRY_DISABLED;
	}
	private get TELEMETRY_DISABLED() {
		return process.env.TELEMETRY_DISABLED;
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
		if (currentValue) {
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
		this._anonymousProjectInfo = this._anonymousProjectInfo || getProjectInfo(isCI);
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

		const meta: EventMeta = {
			...getSystemInfo({ astroVersion: this.astroVersion, viteVersion: this.viteVersion }),
			isGit: this.anonymousProjectInfo.isGit,
		};

		const context: EventContext = {
			anonymousId: this.anonymousId,
			anonymousProjectId: this.anonymousProjectInfo.anonymousProjectId,
			anonymousSessionId: this.anonymousSessionId,
		};

		// Every CI session also creates a new user, which blows up telemetry.
		// To solve this, we track all CI runs under a single "CI" anonymousId.
		if (meta.isCI) {
			context.anonymousId = `CI.${meta.ciName || 'UNKNOWN'}`;
		}

		return post({
			context,
			meta,
			events,
		}).catch((err) => {
			// Log the error to the debugger, but otherwise do nothing.
			this.debug(`Error sending event: ${err.message}`);
		});
	}
}
