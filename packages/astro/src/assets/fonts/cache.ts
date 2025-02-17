import type { Storage } from 'unstorage';

export const createCache = ({ storage }: { storage: Storage }) => {
	return {
		cache: async (
			key: string,
			cb: () => Promise<Buffer>,
		): Promise<{ cached: boolean; data: Buffer }> => {
			const existing = await storage.getItemRaw(key);
			if (existing) {
				return { cached: true, data: existing };
			}
			const data = await cb();
			await storage.setItemRaw(key, data);
			return { cached: false, data };
		},
	};
};

export type Cache = ReturnType<typeof createCache>;
