export function createRoundedBadge() {
	const badge = document.createElement('astro-dev-toolbar-badge');

	badge.shadowRoot.innerHTML = `
		<style>
			:host>div {
				padding: 12px 8px;
				font-size: 14px;
				display: flex;
				gap: 4px;
			}
		</style>
	`;

	return badge;
}
