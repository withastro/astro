import type * as vite from 'vite';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:i18n';

type AstroInternationalization = {
	settings: AstroSettings;
};

export default function astroInternationalization({
	settings,
}: AstroInternationalization): vite.Plugin {
	const { i18n } = settings.config;
	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (i18n === undefined) throw new AstroError(AstroErrorData.i18nNotEnabled);
				return this.resolve('astro/virtual-modules/i18n.js');
			},
		},
	};
}
