import type { Integration, IntegrationCategory } from '../../domain/integration.js';

export class SolidIntegration implements Integration {
	readonly name: string = 'solid-js';
	readonly category: IntegrationCategory = 'ui';
	readonly aliases: string[] = ['solid'];
	readonly official: boolean = true;
}
