import type {
	AstroComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRResult,
} from '../../types/public/internal.js';
export interface HydrationMetadata {
	directive: string;
	value: string;
	componentUrl: string;
	componentExport: {
		value: string;
	};
}
type Props = Record<string | number | symbol, any>;
interface ExtractedProps {
	isPage: boolean;
	hydration: HydrationMetadata | null;
	props: Props;
	propsWithoutTransitionAttributes: Props;
}
export declare function extractDirectives(
	inputProps: Props,
	clientDirectives: SSRResult['clientDirectives'],
): ExtractedProps;
interface HydrateScriptOptions {
	renderer: SSRLoadedRenderer;
	result: SSRResult;
	astroId: string;
	props: Record<string | number, any>;
	attrs: Record<string, string> | undefined;
}
/** For hydrated components, generate a <script type="module"> to load the component */
export declare function generateHydrateScript(
	scriptOptions: HydrateScriptOptions,
	metadata: Required<AstroComponentMetadata>,
): Promise<SSRElement>;
export {};
