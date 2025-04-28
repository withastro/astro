import { fileURLToPath } from 'node:url';
import { type Storage, createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';

export function createFsStorage({ base }: { base: URL }): Storage {
	return createStorage({
		// Types are weirly exported
		driver: (fsLiteDriver as unknown as typeof fsLiteDriver.default)({
			base: fileURLToPath(base),
		}),
	});
}
