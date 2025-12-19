import type { Integration, IntegrationCategory } from '../../domain/integration.js';

export class StarlightIntegration implements Integration {
	readonly name: string = 'starlight';
	readonly category: IntegrationCategory = 'docs';
	readonly aliases: null = null;
	readonly official: boolean = true;
}
