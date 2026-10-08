// @ts-check
import { dim, green, red } from 'kleur/colors';

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

export function logUpdated() {
	console.info(dim(`[${dt.format(new Date())}] `) + green('✔ updated'));
}

/**
 * @param {unknown} error
 */
export function logError(error) {
	console.error(
		dim(`[${dt.format(new Date())}] `) +
			red(error instanceof Error ? error.message : String(error)),
	);
}
