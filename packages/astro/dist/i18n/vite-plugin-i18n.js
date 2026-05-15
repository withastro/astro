import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
const VIRTUAL_MODULE_ID = 'astro:i18n';
function astroInternationalization({ settings }) {
	const { i18n } = settings.config;
	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (i18n === void 0) throw new AstroError(AstroErrorData.i18nNotEnabled);
				return this.resolve('astro/virtual-modules/i18n.js');
			},
		},
	};
}
export { astroInternationalization as default };
