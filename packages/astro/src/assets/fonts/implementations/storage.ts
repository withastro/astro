import { fileURLToPath } from 'node:url';
import { createStorage, type Storage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';

export class FsStorage {
	static create(base: URL): Storage {
		return createStorage({
			// Types are weirly exported
			driver: (fsLiteDriver as unknown as typeof fsLiteDriver.default)({
				base: fileURLToPath(base),
			}),
		});
	}
}
