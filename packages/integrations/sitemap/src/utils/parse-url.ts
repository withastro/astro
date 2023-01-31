export const parseUrl = (
	url: string,
	defaultLocale: string,
	localeCodes: string[],
	base: string
) => {
	if (
		!url ||
		!defaultLocale ||
		localeCodes.length === 0 ||
		localeCodes.some((key) => !key) ||
		!base
	) {
		throw new Error('parseUrl: some parameters are empty');
	}
	if (url.indexOf(base) !== 0) {
		return undefined;
	}
	let s = url.replace(base, '');
	if (!s || s === '/') {
		return { locale: defaultLocale, path: '/' };
	}
	if (!s.startsWith('/')) {
		s = '/' + s;
	}
	const a = s.split('/');
	const locale = a[1];
	if (localeCodes.some((key) => key === locale)) {
		let path = a.slice(2).join('/');
		if (path === '//') {
			path = '/';
		}
		if (path !== '/' && !path.startsWith('/')) {
			path = '/' + path;
		}
		return { locale, path };
	}
	return { locale: defaultLocale, path: s };
};
