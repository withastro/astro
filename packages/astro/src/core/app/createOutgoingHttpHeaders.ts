import type { OutgoingHttpHeaders } from 'node:http';

/**
 * Takes in a nullable WebAPI Headers object and produces a NodeJS OutgoingHttpHeaders object suitable for usage
 * with ServerResponse.writeHead(..) or ServerResponse.setHeader(..)
 *
 * @param headers WebAPI Headers object
 * @returns {OutgoingHttpHeaders} NodeJS OutgoingHttpHeaders object with multiple set-cookie handled as an array of values
 */
export const createOutgoingHttpHeaders = (
	headers: Headers | undefined | null,
): OutgoingHttpHeaders | undefined => {
	if (!headers) {
		return undefined;
	}

	// Copy the Web Headers into a plain object for Node. Iterating `headers`
	// yields lowercased names with any multi-value header already comma-joined;
	// `isEmpty` records whether anything was copied so a header-less response
	// returns `undefined`. A comma-joined `set-cookie` is invalid, so it is
	// rebuilt as an array below.
	const nodeHeaders: OutgoingHttpHeaders = {};
	let isEmpty = true;
	for (const [key, value] of headers) {
		nodeHeaders[key] = value;
		isEmpty = false;
	}

	if (isEmpty) {
		return undefined;
	}

	// if there is > 1 set-cookie header, we have to fix it to be an array of values
	if (headers.has('set-cookie')) {
		const cookieHeaders = headers.getSetCookie();
		if (cookieHeaders.length > 1) {
			// the Headers API already normalized all header names to lowercase so we can safely index this as 'set-cookie'
			nodeHeaders['set-cookie'] = cookieHeaders;
		}
	}

	return nodeHeaders;
};
