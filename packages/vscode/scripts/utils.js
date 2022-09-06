const { dim, green, red, yellow } = require('kleur/colors');

const watchMode = {
	onRebuild(error, result) {
		const date = new Date().toISOString();
		if (error || (result && result.errors.length)) {
			console.error(dim(`[${date}] `) + red(error || result.errors.join('\n')));
		} else {
			if (result.warnings.length) {
				console.log(dim(`[${date}] `) + yellow('⚠ updated with warnings:\n' + result.warnings.join('\n')));
			}
			console.log(dim(`[${date}] `) + green('✔ updated'));
		}
	},
};

exports.watchMode = watchMode;
