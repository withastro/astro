class RemoteRuntimeFontFileUrlResolver {
	#urls;
	#address;
	constructor({ urls, address }) {
		this.#urls = urls;
		this.#address = address;
	}
	resolve(url) {
		if (!this.#urls.has(url)) {
			return null;
		}
		if (!this.#address) {
			throw new Error('Server address unavailable, this should not happen. Open an issue.');
		}
		if (!url.startsWith('/')) {
			url = new URL(url).pathname;
		}
		const host =
			this.#address.family === 'IPv6' ? `[${this.#address.address}]` : this.#address.address;
		return `http://${host}:${this.#address.port}${url}`;
	}
}
export { RemoteRuntimeFontFileUrlResolver };
