export type IntegrationCategory = 'ui' | 'docs' | 'adapter' | 'other';

export interface Integration {
	readonly name: string;
	readonly category: IntegrationCategory;
	readonly aliases: Array<string> | null;
	readonly official: boolean;
}
