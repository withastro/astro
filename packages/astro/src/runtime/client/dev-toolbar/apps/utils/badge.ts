export function createRoundedBadge() {
	const badge = document.createElement('astro-dev-toolbar-badge');
	badge.shadowRoot.innerHTML = `
		<style>
			:host>div {
				border-radius: 9999px;
				padding: 12px 8px;
			}
		</style>
	`;

	return badge;
}
