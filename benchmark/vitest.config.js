import codspeedPlugin from '@codspeed/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: process.env.CODSPEED ? [codspeedPlugin()] : [],
	include: ['./bench/*.bench.js'],
	test: {
		env: {
			ASTRO_TELEMETRY_DISABLED: '1',
			// Idle Rolldown workers spin on `sched_yield`, so an unpinned pool measures host CPU count.
			ROLLDOWN_WORKER_THREADS: '4',
			RAYON_NUM_THREADS: '4',
		},
	},
});
