/** Appends the collection of the entry being rendered, as seen by Markdown plugins. */
export function remarkCollection() {
	return (tree, file) => {
		const collection = file.data.astro?.collection;
		tree.children.push({
			type: 'paragraph',
			children: [
				{
					type: 'text',
					value: collection
						? `collection: ${collection.name} (${collection.descriptors.library ?? 'none'})`
						: 'collection: unknown',
				},
			],
		});
	};
}
