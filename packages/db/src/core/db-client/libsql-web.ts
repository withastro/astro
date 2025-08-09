import { createClient as createLibsqlClient } from '@libsql/client/web';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql/web';
import { parseOpts } from '../../runtime/utils.js';

type RemoteDbClientOptions = {
	token: string;
	url: string;
};

export function createClient(opts: RemoteDbClientOptions) {
	const { token, url } = opts;

	let parsedUrl = new URL(url);
	const options: Record<string, string> = Object.fromEntries(parsedUrl.searchParams.entries());
	parsedUrl.search = '';

	let dbURL = parsedUrl.toString();

	const supportedProtocols = ['http:', 'https:', 'libsql:'];

	if (!supportedProtocols.includes(parsedUrl.protocol)) {
		throw new Error(
			`Unsupported protocol "${parsedUrl.protocol}" for libSQL web client. Supported protocols are: ${supportedProtocols.join(', ')}.`,
		);
	}

	const client = createLibsqlClient({ ...parseOpts(options), url: dbURL, authToken: token });
	return drizzleLibsql(client);
}
