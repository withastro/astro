import { importPlugin as _importPlugin } from '#import-plugin';
async function importPlugin(p) {
	if (typeof p === 'string') {
		return await _importPlugin(p);
	} else {
		return p;
	}
}
function loadPlugins(items) {
	return items.map((p) => {
		return new Promise((resolve, reject) => {
			if (Array.isArray(p)) {
				const [plugin, opts] = p;
				return importPlugin(plugin)
					.then((m) => resolve([m, opts]))
					.catch((e) => reject(e));
			}
			return importPlugin(p)
				.then((m) => resolve([m]))
				.catch((e) => reject(e));
		});
	});
}
export { loadPlugins };
