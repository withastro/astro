function getResolvedHostForHttpServer(host) {
	if (host === false) {
		return 'localhost';
	} else if (host === true) {
		return void 0;
	} else {
		return host;
	}
}
function stripBase(path, base) {
	if (path === base) {
		return '/';
	}
	const baseWithSlash = base.endsWith('/') ? base : base + '/';
	return path.replace(RegExp('^' + baseWithSlash), '/');
}
export { getResolvedHostForHttpServer, stripBase };
