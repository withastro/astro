import { createClient } from '@libsql/client';
import type { ContentStorageConfig } from './types.js';

export function createDatabaseClient({ url, token }: ContentStorageConfig) {
	return createClient({ url, authToken: token });
}
