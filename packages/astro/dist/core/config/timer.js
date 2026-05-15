import fs from 'node:fs';
class AstroTimer {
	enabled;
	ongoingTimers = /* @__PURE__ */ new Map();
	stats = {};
	constructor() {
		this.enabled = !!process.env.ASTRO_TIMER_PATH;
	}
	/**
	 * Start a timer for a scope with a given name.
	 */
	start(name) {
		if (!this.enabled) return;
		globalThis.gc?.();
		this.ongoingTimers.set(name, {
			startTime: performance.now(),
			startHeap: process.memoryUsage().heapUsed,
		});
	}
	/**
	 * End a timer for a scope with a given name.
	 */
	end(name) {
		if (!this.enabled) return;
		const stat = this.ongoingTimers.get(name);
		if (!stat) return;
		globalThis.gc?.();
		const endHeap = process.memoryUsage().heapUsed;
		this.stats[name] = {
			elapsedTime: performance.now() - stat.startTime,
			heapUsedChange: endHeap - stat.startHeap,
			heapUsedTotal: endHeap,
		};
		this.ongoingTimers.delete(name);
	}
	/**
	 * Write stats to `process.env.ASTRO_TIMER_PATH`
	 */
	writeStats() {
		if (!this.enabled) return;
		fs.writeFileSync(process.env.ASTRO_TIMER_PATH, JSON.stringify(this.stats, null, 2));
	}
}
export { AstroTimer };
