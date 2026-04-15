import { ELEMENT_NODE, TEXT_NODE, parse, renderSync } from 'ultrahtml';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { SvgComponentProps } from '../runtime.js';
import { dropAttributes } from '../runtime.js';
import type { ImageMetadata } from '../types.js';
import type { SvgOptimizer } from './types.js';

async function parseSvg({
	path,
	contents,
	svgOptimizer,
}: {
	path: string;
	contents: string;
	svgOptimizer: SvgOptimizer | undefined;
}) {
	let processedContents = contents;
	if (svgOptimizer) {
		try {
			processedContents = await svgOptimizer.optimize(contents);
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.CannotOptimizeSvg,
					message: AstroErrorData.CannotOptimizeSvg.message(path, svgOptimizer.name),
				},
				{ cause },
			);
		}
	}
	const root = parse(processedContents);
	const svgNode = root.children.find(
		({ name, type }: { name: string; type: number }) => type === ELEMENT_NODE && name === 'svg',
	);
	if (!svgNode) {
		throw new Error('SVG file does not contain an <svg> element');
	}
	const { attributes, children } = svgNode;
	const body = renderSync({ ...root, children });

	// Collect text content of <style> elements for head propagation and CSP hashing
	const styles: string[] = [];
	for (const child of children) {
		if (child.type === ELEMENT_NODE && child.name === 'style') {
			const textContent = child.children
				?.filter((c: { type: number }) => c.type === TEXT_NODE)
				.map((c: { value: string }) => c.value)
				.join('');
			if (textContent) {
				styles.push(textContent);
			}
		}
	}

	return { attributes, body, styles };
}

export async function makeSvgComponent(
	meta: ImageMetadata,
	contents: Buffer | string,
	svgOptimizer: SvgOptimizer | undefined,
): Promise<string> {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const {
		attributes,
		body: children,
		styles,
	} = await parseSvg({
		path: meta.fsPath,
		contents: file,
		svgOptimizer,
	});
	const props: SvgComponentProps = {
		meta,
		attributes: dropAttributes(attributes),
		children,
		styles,
	};

	return `import { createSvgComponent } from 'astro/assets/runtime';
export default createSvgComponent(${JSON.stringify(props)})`;
}

/**
 * Parse an SVG file and return the serialisable component data
 * (attributes + inner HTML body) without generating any module code.
 * @internal Used by the asset pipeline for content-collection SVG images.
 */
export async function parseSvgComponentData(
	meta: ImageMetadata,
	contents: Buffer | string,
	svgOptimizer: SvgOptimizer | undefined,
): Promise<{ attributes: Record<string, string>; children: string; styles: string[] }> {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const {
		attributes,
		body: children,
		styles,
	} = await parseSvg({
		path: meta.fsPath,
		contents: file,
		svgOptimizer,
	});
	return { attributes: dropAttributes(attributes), children, styles };
}
