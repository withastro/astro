import type { IntegrationCategory } from './domain/integration.js';

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
	ui: 'UI Frameworks',
	docs: 'Documentation Frameworks',
	adapter: 'SSR Adapters',
	other: 'Others',
};
