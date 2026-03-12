import { optimize } from 'svgo';
import { parse, renderSync } from 'ultrahtml';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { SvgComponentProps } from '../runtime.js';
import { dropAttributes } from '../runtime.js';
import type { ImageMetadata } from '../types.js';

function parseSvg({
	path,
	contents,
	svgoConfig,
}: {
	path: string;
	contents: string;
	svgoConfig: AstroConfig['experimental']['svgo'];
}) {
	let processedContents = contents;
	if (svgoConfig) {
		try {
			const config = typeof svgoConfig === 'boolean' ? undefined : svgoConfig;
			const result = optimize(contents, config);
			processedContents = result.data;
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.CannotOptimizeSvg,
					message: AstroErrorData.CannotOptimizeSvg.message(path),
				},
				{ cause },
			);
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
	svgoConfig: AstroConfig['experimental']['svgo'],
): string {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const { attributes, body: children } = parseSvg({
		path: meta.fsPath,
		contents: file,
		svgoConfig,
	});
	const props: SvgComponentProps = {
		meta,
		attributes: dropAttributes(attributes),
		children,
	};

	return `import { createSvgComponent } from 'astro/assets/runtime';
export default createSvgComponent(${JSON.stringify(props)})`;
}

/**
 * Parse an SVG file and return the serialisable component data
 * (attributes + inner HTML body) without generating any module code.
 * @internal Used by the asset pipeline for content-collection SVG images.
 */
export function parseSvgComponentData(
	meta: ImageMetadata,
	contents: Buffer | string,
	svgoConfig: AstroConfig['experimental']['svgo'],
): { attributes: Record<string, string>; children: string } {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const { attributes, body: children } = parseSvg({
		path: meta.fsPath,
		contents: file,
		svgoConfig,
	});
	return { attributes: dropAttributes(attributes), children };
}
