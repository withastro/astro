// @ts-check
import { dim, green, red, yellow } from 'kleur/colors';

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

/**
 * @type {import('esbuild').Plugin}
 */
export const rebuildPlugin = {
	name: 'astro:rebuild',
	setup(build) {
		build.onEnd(async (result) => {
			const date = dt.format(new Date());
			if (result && result.errors.length) {
				console.error(dim(`[${date}] `) + red(result.errors.map((error) => error.text).join('\n')));
			} else {
				if (result.warnings.length) {
					console.info(
						dim(`[${date}] `) + yellow('⚠ updated with warnings:\n' + result.warnings.join('\n')),
					);
				}
				console.info(dim(`[${date}] `) + green('✔ updated'));
			}
		});
	},
};
