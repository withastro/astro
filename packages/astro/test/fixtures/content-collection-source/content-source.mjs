const entries = {
	alpha: {
		id: 'alpha',
		data: { title: 'From the database', order: 1 },
	},
	beta: {
		id: 'beta',
		data: { title: 'Also from the database', order: 2 },
	},
};

export default function createSource(config) {
	return {
		hasCollection(collection) {
			return collection === 'databasePosts';
		},
		get(collection, id) {
			if (collection !== 'databasePosts') return undefined;
			const entry = entries[id];
			if (!entry) return undefined;
			return { ...entry, data: { ...entry.data, source: config.label } };
		},
		values(collection) {
			if (collection !== 'databasePosts') return [];
			return Object.values(entries).map((entry) => ({
				...entry,
				data: { ...entry.data, source: config.label },
			}));
		},
	};
}
