import type { TransformOptions } from '@astrojs/compiler';
import type { SourceMapInput } from 'rollup';
import type { TransformStyle } from './types';

type PreprocessStyle = TransformOptions['preprocessStyle'];

export function createStylePreprocessor(
	transformStyle: TransformStyle,
	cssDeps: Set<string>,
	errors: Error[]
): PreprocessStyle {
	const preprocessStyle: PreprocessStyle = async (value: string, attrs: Record<string, string>) => {
		const lang = `.${attrs?.lang || 'css'}`.toLowerCase();

		try {
			const result = await transformStyle(value, lang);

			if (!result) return null as any; // TODO: add type in compiler to fix "any"

			for (const dep of result.deps) {
				cssDeps.add(dep);
			}

			let map: SourceMapInput | undefined;
			if (result.map) {
				if (typeof result.map === 'string') {
					map = result.map;
				} else if (result.map.mappings) {
					map = result.map.toString();
				}
			}

			return { code: result.code, map };
		} catch (err) {
			errors.push(err as unknown as Error);
			return {
				error: err + '',
			};
		}
	};

	return preprocessStyle;
}
