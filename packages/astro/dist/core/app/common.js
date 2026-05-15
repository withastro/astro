function toRoutingStrategy(routing, domains) {
	let strategy;
	const hasDomains = domains ? Object.keys(domains).length > 0 : false;
	if (routing === 'manual') {
		strategy = 'manual';
	} else {
		if (!hasDomains) {
			if (routing?.prefixDefaultLocale === true) {
				if (routing.redirectToDefaultLocale) {
					strategy = 'pathname-prefix-always';
				} else {
					strategy = 'pathname-prefix-always-no-redirect';
				}
			} else {
				strategy = 'pathname-prefix-other-locales';
			}
		} else {
			if (routing?.prefixDefaultLocale === true) {
				if (routing.redirectToDefaultLocale) {
					strategy = 'domains-prefix-always';
				} else {
					strategy = 'domains-prefix-always-no-redirect';
				}
			} else {
				strategy = 'domains-prefix-other-locales';
			}
		}
	}
	return strategy;
}
function toFallbackType(routing) {
	if (routing === 'manual') {
		return 'rewrite';
	}
	return routing.fallbackType;
}
const PREFIX_DEFAULT_LOCALE = /* @__PURE__ */ new Set([
	'pathname-prefix-always',
	'domains-prefix-always',
	'pathname-prefix-always-no-redirect',
	'domains-prefix-always-no-redirect',
]);
const REDIRECT_TO_DEFAULT_LOCALE = /* @__PURE__ */ new Set([
	'pathname-prefix-always-no-redirect',
	'domains-prefix-always-no-redirect',
]);
function fromRoutingStrategy(strategy, fallbackType) {
	let routing;
	if (strategy === 'manual') {
		routing = 'manual';
	} else {
		routing = {
			prefixDefaultLocale: PREFIX_DEFAULT_LOCALE.has(strategy),
			redirectToDefaultLocale: !REDIRECT_TO_DEFAULT_LOCALE.has(strategy),
			fallbackType,
		};
	}
	return routing;
}
export { fromRoutingStrategy, toFallbackType, toRoutingStrategy };
