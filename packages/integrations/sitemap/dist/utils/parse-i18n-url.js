function parseI18nUrl(url, defaultLocale, locales, base) {
	if (!url.startsWith(base)) {
		return void 0;
	}
	let s = url.slice(base.length);
	if (!s || s === '/') {
		return { locale: defaultLocale, path: '/' };
	}
	if (s[0] !== '/') {
		s = '/' + s;
	}
	const locale = s.split('/')[1];
	if (locale in locales) {
		let path = s.slice(1 + locale.length);
		if (!path) {
			path = '/';
		}
		return { locale, path };
	}
	return { locale: defaultLocale, path: s };
}
export { parseI18nUrl };
