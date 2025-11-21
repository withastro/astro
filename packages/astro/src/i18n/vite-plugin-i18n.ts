import type * as vite from 'vite';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';

const virtualModuleId = 'astro:i18n';

type AstroInternationalization = {
	settings: AstroSettings;
};

export default function astroInternationalization({
	settings,
}: AstroInternationalization): vite.Plugin {
	const { i18n } = settings.config;
	return {
		name: 'astro:i18n',
		enforce: 'pre',
		resolveId(id) {
			if (id === virtualModuleId) {
				if (i18n === undefined) throw new AstroError(AstroErrorData.i18nNotEnabled);
				return this.resolve('astro/virtual-modules/i18n.js');
			}
		},
	};
}
