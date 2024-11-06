import { parse, renderSync } from 'ultrahtml';
import type { ImageMetadata } from '../types.js';
import type { SvgComponentProps } from '../runtime.js';
import { dropAttributes } from '../runtime.js';

function parseSvg(contents: string) {
	const root = parse(contents);
	const [{ attributes, children }] = root.children;
	const body = renderSync({ ...root, children });

	return { attributes, body };
}

export type SvgRenderMode = 'inline' | 'sprite';

export function makeSvgComponent(meta: ImageMetadata, contents: Buffer | string, options?: { mode?: SvgRenderMode }) {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const { attributes, body: children } = parseSvg(file);
	const props: SvgComponentProps = {
		meta,
		attributes: dropAttributes({ mode: options?.mode, ...attributes }),
		children,
	};

	return `import { createSvgComponent } from 'astro/assets/runtime';
export default createSvgComponent(${JSON.stringify(props)})`;
}
