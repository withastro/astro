import type * as estree from 'estree';
import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import {
	AstroIntegrationLogger,
	type AstroLoggerMessage,
} from '../../../astro/dist/core/logger/core.js';

export type RemarkPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	mdast.Root
>;

export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

export type RecmaPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	estree.Program
>;

export class SpyIntegrationLogger extends AstroIntegrationLogger {
	readonly messages: AstroLoggerMessage[];

	constructor() {
		const messages: AstroLoggerMessage[] = [];
		super(
			{
				destination: {
					write(chunk): boolean {
						messages.push(chunk);
						return true;
					},
				},
				level: 'warn',
			},
			'test-spy',
		);
		this.messages = messages;
	}
}
