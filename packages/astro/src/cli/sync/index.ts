import nodeFs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { dim } from 'kleur/colors';
import type { AstroSettings } from '../../@types/astro';
import { error, info, LogOptions } from '../../core/logger/core.js';
import { contentObservable, createContentTypesGenerator } from '../../content/index.js';
import { getTimeStat } from '../../core/build/util.js';

export async function sync(
	settings: AstroSettings,
	{ logging }: { logging: LogOptions }
): Promise<0 | 1> {
	const timerStart = performance.now();

	const contentTypesGenerator = await createContentTypesGenerator({
		contentConfigObserver: contentObservable({ status: 'loading' }),
		logging,
		fs: nodeFs,
		settings,
	});

	try {
		await contentTypesGenerator.init();
	} catch (e) {
		error(logging, 'content', 'Failed to generate content collection types: ' + e);
		return 1;
	}

	info(logging, 'content', `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);

	return 0;
}
