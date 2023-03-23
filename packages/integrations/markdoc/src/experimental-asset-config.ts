import type { Config as MarkdocConfig } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

export const expermentalAssetConfig: MarkdocConfig = {
	nodes: {
		image: {
			...Markdoc.nodes.image,
			transform(node, config) {
				const attributes = node.transformAttributes(config);
				const children = node.transformChildren(config);

				if (node.type === 'image' && '__optimizedSrc' in node.attributes) {
					const { __optimizedSrc, ...rest } = node.attributes;
					return new Markdoc.Tag('Image', { ...rest, src: __optimizedSrc }, children);
				} else {
					return new Markdoc.Tag('img', attributes, children);
				}
			},
		},
	},
};
