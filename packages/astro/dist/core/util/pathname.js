class MultiLevelEncodingError extends Error {
	constructor() {
		super('Multi-level URL encoding is not allowed');
		this.name = 'MultiLevelEncodingError';
	}
}
function validateAndDecodePathname(pathname) {
	let decoded;
	try {
		decoded = decodeURI(pathname);
	} catch (_e) {
		throw new Error('Invalid URL encoding');
	}
	const hasDecoding = decoded !== pathname;
	const decodedStillHasEncoding = /%[0-9a-fA-F]{2}/.test(decoded);
	if (hasDecoding && decodedStillHasEncoding) {
		throw new MultiLevelEncodingError();
	}
	return decoded;
}
export { MultiLevelEncodingError, validateAndDecodePathname };
