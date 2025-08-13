import { optimize } from 'svgo';

import { parse, renderSync } from 'ultrahtml';
import type { AstroConfigType } from '../../core/config/schemas/index.js';

import type { SvgComponentProps } from '../runtime.js';
import { dropAttributes } from '../runtime.js';
import type { ImageMetadata } from '../types.js';

function parseSvg(contents: string, svgConfig?: AstroConfigType['experimental']['svg']) {
	let processedContents = contents;
	if (svgConfig?.optimize) {
		try {
			const result = optimize(contents, svgConfig.svgoConfig);
			processedContents = result.data;
		} catch (error) {
			console.warn('SVGO optimization failed:', error);
			processedContents = contents;
		}
	}
	const root = parse(processedContents);
	const svgNode = root.children.find(
		({ name, type }: { name: string; type: number }) => type === 1 /* Element */ && name === 'svg',
	);
	if (!svgNode) {
		throw new Error('SVG file does not contain an <svg> element');
	}
	const { attributes, children } = svgNode;
	const body = renderSync({ ...root, children });

	return { attributes, body };
}

export function makeSvgComponent(
	meta: ImageMetadata,
	contents: Buffer | string,
	svgConfig?: AstroConfigType['experimental']['svg'],
): string {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const { attributes, body: children } = parseSvg(file, svgConfig);
	const props: SvgComponentProps = {
		meta,
		attributes: dropAttributes(attributes),
		children,
	};

	return `import { createSvgComponent } from 'astro/assets/runtime';
export default createSvgComponent(${JSON.stringify(props)})`;
}
