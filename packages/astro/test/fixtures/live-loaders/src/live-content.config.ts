
const entries = {
	'123': { id: '123', data: { title: '123' } },
	'456': { id: '456', data: { title: '456' } },
	'789': { id: '789', data: { title: '789' } },
}

const liveStuff = {	
	type: 'live',
	loader: {
		getEntry: async (collection, slug) => {
			return entries[slug as any] || null;
		},
		getCollection: async (collection, filter) => {
			if (filter) {
				return Object.values(entries).filter((entry) => filter(entry));
			}
			return Object.values(entries);
		}
	}
}
export const collections = { liveStuff };
