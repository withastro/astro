import * as z from 'zod/v4';
import {
	validateAssetsPrefix,
	validateFontsCssVariables,
	validateI18nDefaultLocale,
	validateI18nDomains,
	validateI18nFallback,
	validateI18nRedirectToDefaultLocale,
	validateOutDirNotInPublicDir,
	validateRemotePatterns,
} from './refined-validators.js';
const AstroConfigRefinedSchema = z.custom().superRefine((config, ctx) => {
	let issues = [];
	issues = issues.concat(
		validateAssetsPrefix(config),
		validateRemotePatterns(config.image.remotePatterns),
		validateI18nRedirectToDefaultLocale(config.i18n),
		validateOutDirNotInPublicDir(config.outDir, config.publicDir),
	);
	if (config.i18n) {
		issues = issues.concat(
			validateI18nDefaultLocale(config.i18n),
			validateI18nFallback(config.i18n),
			validateI18nDomains(config),
		);
	}
	if (config.fonts && config.fonts.length > 0) {
		issues = issues.concat(validateFontsCssVariables(config.fonts));
	}
	for (const issue of issues) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: issue.message,
			path: issue.path,
		});
	}
});
export { AstroConfigRefinedSchema };
