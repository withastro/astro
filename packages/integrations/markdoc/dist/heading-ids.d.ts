import { type Config as MarkdocConfig, type Schema } from '@markdoc/markdoc';
import Slugger from 'github-slugger';
interface HeadingIdConfig extends MarkdocConfig {
	ctx: {
		headingSlugger: Slugger;
	};
}
export declare const heading: Schema;
export declare function setupHeadingConfig(): HeadingIdConfig;
export {};
