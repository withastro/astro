import TestComponent from '../components/TestComponent.astro';

export function hasComponentDefaultExport() {
	return Boolean(TestComponent);
}
