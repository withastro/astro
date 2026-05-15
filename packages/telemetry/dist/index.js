import { randomBytes } from 'node:crypto';
import { isCI } from 'ci-info';
import { GlobalConfig } from './config.js';
import * as KEY from './config-keys.js';
import { post } from './post.js';
import { getProjectInfo } from './project-info.js';
import { getSystemInfo } from './system-info.js';
const VALID_TELEMETRY_NOTICE_DATE = '2023-08-25';
function getDebug() {
	return globalThis._astroGlobalDebug;
}
class AstroTelemetry {
	opts;
	_anonymousSessionId;
	_anonymousProjectInfo;
	config = new GlobalConfig({ name: 'astro' });
	isCI = isCI;
	env = process.env;
	get astroVersion() {
		return this.opts.astroVersion;
	}
	get viteVersion() {
		return this.opts.viteVersion;
	}
	get ASTRO_TELEMETRY_DISABLED() {
		return this.env.ASTRO_TELEMETRY_DISABLED;
	}
	get TELEMETRY_DISABLED() {
		return this.env.TELEMETRY_DISABLED;
	}
	constructor(opts) {
		this.opts = opts;
	}
	/**
	 * Get value from either the global config or the provided fallback.
	 * If value is not set, the fallback is saved to the global config,
	 * persisted for later sessions.
	 */
	getConfigWithFallback(key, getValue) {
		const currentValue = this.config.get(key);
		if (currentValue !== void 0) {
			return currentValue;
		}
		const newValue = getValue();
		this.config.set(key, newValue);
		return newValue;
	}
	get enabled() {
		return this.getConfigWithFallback(KEY.TELEMETRY_ENABLED, () => true);
	}
	get notifyDate() {
		return this.getConfigWithFallback(KEY.TELEMETRY_NOTIFY_DATE, () => '');
	}
	get anonymousId() {
		return this.getConfigWithFallback(KEY.TELEMETRY_ID, () => randomBytes(32).toString('hex'));
	}
	get anonymousSessionId() {
		this._anonymousSessionId = this._anonymousSessionId || randomBytes(32).toString('hex');
		return this._anonymousSessionId;
	}
	get anonymousProjectInfo() {
		this._anonymousProjectInfo = this._anonymousProjectInfo || getProjectInfo(this.isCI);
		return this._anonymousProjectInfo;
	}
	get isDisabled() {
		if (Boolean(this.ASTRO_TELEMETRY_DISABLED || this.TELEMETRY_DISABLED)) {
			return true;
		}
		return this.enabled === false;
	}
	setEnabled(value) {
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
	async notify(callback) {
		const debug = getDebug();
		if (this.isDisabled || this.isCI) {
			debug?.('telemetry', `[notify] telemetry has been disabled`);
			return;
		}
		if (this.isValidNotice()) {
			debug?.('telemetry', `[notify] last notified on ${this.notifyDate}`);
			return;
		}
		const enabled = await callback();
		this.config.set(KEY.TELEMETRY_NOTIFY_DATE, /* @__PURE__ */ new Date().valueOf().toString());
		this.config.set(KEY.TELEMETRY_ENABLED, enabled);
		debug?.('telemetry', `[notify] telemetry has been ${enabled ? 'enabled' : 'disabled'}`);
	}
	async record(event = []) {
		const events = Array.isArray(event) ? event : [event];
		if (events.length < 1) {
			return Promise.resolve();
		}
		const debug = getDebug();
		if (this.isDisabled) {
			debug?.('telemetry', '[record] telemetry has been disabled');
			return Promise.resolve();
		}
		const meta = {
			...getSystemInfo({ astroVersion: this.astroVersion, viteVersion: this.viteVersion }),
		};
		const context = {
			...this.anonymousProjectInfo,
			anonymousId: this.anonymousId,
			anonymousSessionId: this.anonymousSessionId,
		};
		if (meta.isCI) {
			context.anonymousId = `CI.${meta.ciName || 'UNKNOWN'}`;
		}
		const debugOutput =
			process.env.DEBUG?.includes('astro:telemetry') ||
			process.env.DEBUG?.includes('astro:*') ||
			process.env.DEBUG === '*';
		if (debugOutput && debug) {
			debug('telemetry', { context, meta });
			debug('telemetry', JSON.stringify(events, null, 2));
			return Promise.resolve();
		}
		return post({
			context,
			meta,
			events,
		}).catch((err) => {
			debug?.('telemetry', `Error sending event: ${err.message}`);
		});
	}
}
export { AstroTelemetry };
