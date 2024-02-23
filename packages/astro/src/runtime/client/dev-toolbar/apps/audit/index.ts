import { finder } from '@medv/finder';
import type { DevToolbarApp, DevToolbarMetadata } from '../../../../../@types/astro.js';
import type { DevToolbarHighlight } from '../../ui-library/highlight.js';
import {
	attachTooltipToHighlight,
	createHighlight,
	getElementsPositionInDocument,
	positionHighlight,
} from '../utils/highlight.js';
import { createWindowElement } from '../utils/window.js';
import {
	categoryLabel,
	getAuditCategory,
	resolveAuditRule,
	rules,
	type AuditRule,
	type ResolvedAuditRule,
} from './rules/index.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 1 20 16"><path fill="#fff" d="M.6 2A1.1 1.1 0 0 1 1.7.9h16.6a1.1 1.1 0 1 1 0 2.2H1.6A1.1 1.1 0 0 1 .8 2Zm1.1 7.1h6a1.1 1.1 0 0 0 0-2.2h-6a1.1 1.1 0 0 0 0 2.2ZM9.3 13H1.8a1.1 1.1 0 1 0 0 2.2h7.5a1.1 1.1 0 1 0 0-2.2Zm11.3 1.9a1.1 1.1 0 0 1-1.5 0l-1.7-1.7a4.1 4.1 0 1 1 1.6-1.6l1.6 1.7a1.1 1.1 0 0 1 0 1.6Zm-5.3-3.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/></svg>';

type Audit = {
	highlightElement: DevToolbarHighlight;
	auditedElement: HTMLElement;
	rule: AuditRule;
	card: HTMLElement;
};

export default {
	id: 'astro:audit',
	name: 'Audit',
	icon: icon,
	async init(canvas, eventTarget) {
		let audits: Audit[] = [];

		await lint();

		document.addEventListener('astro:after-swap', async () => lint());
		document.addEventListener('astro:page-load', async () => refreshLintPositions);

		function onPageClick(event: MouseEvent) {
			const target = event.target as Element | null;
			if (!target) return;
			if (!target.closest) return;
			if (target.closest('astro-dev-toolbar')) return;
			if (audits.some((audit) => audit.card.hasAttribute('active'))) {
				audits.forEach((audit) => {
					audit.card.removeAttribute('active');
				});
				return;
			}
			eventTarget.dispatchEvent(
				new CustomEvent('toggle-app', {
					detail: {
						state: false,
					},
				})
			);
		}
		eventTarget.addEventListener('app-toggled', (event: any) => {
			if (event.detail.state === true) {
				document.addEventListener('click', onPageClick, true);
			} else {
				document.removeEventListener('click', onPageClick, true);
			}
		});

		async function lint() {
			audits.forEach(({ highlightElement }) => {
				highlightElement.remove();
			});
			audits = [];
			canvas.getElementById('no-audit')?.remove();
			const selectorCache = new Map<string, NodeListOf<Element>>();

			for (const rule of rules) {
				const elements =
					selectorCache.get(rule.selector) ?? document.querySelectorAll(rule.selector);
				let matches: Element[] = [];
				if (typeof rule.match === 'undefined') {
					matches = Array.from(elements);
				} else {
					for (const element of elements) {
						try {
							if (await rule.match(element)) {
								matches.push(element);
							}
						} catch (e) {
							console.error("Error while running audit's match function", e);
						}
					}
				}
				for (const element of matches) {
					// Don't audit elements that already have an audit on them
					// TODO: This is a naive implementation, it'd be good to show all the audits for an element at the same time.
					if (audits.some((audit) => audit.auditedElement === element)) continue;

					await createAuditProblem(rule, element);
				}
			}

			if (audits.length > 0) {
				eventTarget.dispatchEvent(
					new CustomEvent('toggle-notification', {
						detail: {
							state: true,
						},
					})
				);

				const auditListWindow = createWindowElement(
					`
					<style>
						.reset-button {
							text-align: left;
							border: none;
							margin: 0;
							width: auto;
							overflow: visible;
							background: transparent;
							font: inherit;
							line-height: normal;
							-webkit-font-smoothing: inherit;
							-moz-osx-font-smoothing: inherit;
							-webkit-appearance: none;
							padding: 0;
						}

						astro-dev-toolbar-window {
  	          left: initial;
              top: 8px;
              right: 8px;
              transform: none;
              width: 350px;
							min-height: 350px;
              max-height: 420px;
              padding: 0;
              overflow: hidden;
						}

						hr {
						  margin: 0;
						}

						header {
						  display: flex;
							align-items: center;
							justify-content: space-between;
						  padding: 18px;
						}

						header section {
							display: flex;
							align-items: center;
							gap: 1em;
						}

						h1 {
						  font-size: 22px;
  						font-weight: 600;
  						color: #fff;
						}

						ul, li {
						  margin: 0;
							padding: 0;
							list-style: none;
						}

						h1, h2 {
						  margin: 0;
						}

						h3 {
      		    margin: 0;
              color: white;
							font-size: 17px;
						}

						.audit-header {
							display: flex;
							gap: 8px;
							align-items: center;
						}

						.audit-selector {
							color: white;
							font-size: 15px;
						}

						[active] .audit-selector:hover {
							text-decoration: underline;
							cursor: pointer;
						}

						.extended-info {
							display: none;
							color: white;
							font-size: 14px;
						}

						.extended-info hr {
							border: 1px solid rgba(27, 30, 36, 1);
						}

						.extended-info .audit-message {
							border-left: 4px solid rgba(27, 30, 36, 1);
							padding-left: 8px;
							font-style: italic;
						}

						[active] .extended-info {
							display: block;
						}

						astro-dev-toolbar-icon {
							color: white;
							fill: white;
							display: inline-block;
							height: 24px;
						}

						#audit-list {
  						display: flex;
              flex-direction: column;
							gap: 0.25em;
              overflow: auto;
							overscroll-behavior: contain;
							height: 100%;
						}

						#back-to-list {
							display: none;
							align-items: center;
							gap: 8px;
							padding: 8px;
							color: white;
						}

						#back-to-list:hover {
							cursor: pointer;
							background-color: rgba(255, 255, 255, 0.3);
						}

						#audit-list:has(astro-dev-toolbar-card[active]) #back-to-list {
							display: flex;
						}
					</style>

					<header>
						<section>
							<h1>Audits</h1>
							<astro-dev-toolbar-badge size="large">${audits.length} problem${
								audits.length > 1 ? 's' : ''
							} found</astro-dev-toolbar-badge>
						</section>

						<section></section>
					</header>
					<hr />`
				);

				const auditListUl = document.createElement('ul');
				auditListUl.id = 'audit-list';

				const backToListButton = document.createElement('button');
				backToListButton.id = 'back-to-list';
				backToListButton.classList.add('reset-button');
				backToListButton.innerHTML = `
					<astro-dev-toolbar-icon icon="arrow-left"></astro-dev-toolbar-icon>
					Back to list
				`;

				backToListButton.addEventListener('click', () => {
					audits.forEach((audit) => {
						audit.card.removeAttribute('active');
					});
				});

				auditListUl.appendChild(backToListButton);

				audits.forEach((audit) => {
					auditListUl.appendChild(audit.card);
				});

				auditListWindow.appendChild(auditListUl);

				canvas.append(auditListWindow);
			} else {
				eventTarget.dispatchEvent(
					new CustomEvent('toggle-notification', {
						detail: {
							state: false,
						},
					})
				);

				const window = createWindowElement(
					`<style>
						header {
							display: flex;
						}

						h1 {
							display: flex;
							align-items: center;
							gap: 8px;
							font-weight: 600;
							color: #fff;
							margin: 0;
							font-size: 22px;
						}

						astro-dev-toolbar-icon {
							width: 1em;
						   height: 1em;
						   padding: 8px;
							display: block;
							background: green;
							border-radius: 9999px;
						}
					</style>
					<header>
						<h1><astro-dev-toolbar-icon icon="check-circle"></astro-dev-toolbar-icon>No accessibility or performance issues detected.</h1>
					</header>
					<p>
						Nice work! This app scans the page and highlights common accessibility and performance issues for you, like a missing "alt" attribute on an image, or a image not using performant attributes.
					</p>
					`
				);

				canvas.append(window);
			}

			(['scroll', 'resize'] as const).forEach((event) => {
				window.addEventListener(event, refreshLintPositions);
			});
		}

		function refreshLintPositions() {
			const noAuditBlock = canvas.getElementById('no-audit');
			if (noAuditBlock) {
				const devOverlayRect = document
					.querySelector('astro-dev-toolbar')
					?.shadowRoot.querySelector('#dev-toolbar-root')
					?.getBoundingClientRect();

				noAuditBlock.style.top = `${
					(devOverlayRect?.top ?? 0) - (devOverlayRect?.height ?? 0) - 16
				}px`;
			}

			audits.forEach(({ highlightElement, auditedElement }) => {
				const rect = auditedElement.getBoundingClientRect();
				positionHighlight(highlightElement, rect);
			});
		}

		async function createAuditProblem(rule: AuditRule, originalElement: Element) {
			const computedStyle = window.getComputedStyle(originalElement);
			const targetedElement = (originalElement.children[0] as HTMLElement) || originalElement;

			// If the element is hidden, don't do anything
			if (targetedElement.offsetParent === null || computedStyle.display === 'none') {
				return;
			}

			// If the element is an image but not yet loaded, ignore it
			// TODO: We shouldn't ignore this, because it is valid for an image to not be loaded at start (e.g. lazy loading)
			if (originalElement.nodeName === 'IMG' && !(originalElement as HTMLImageElement).complete) {
				return;
			}

			const rect = originalElement.getBoundingClientRect();
			const highlight = createHighlight(rect, 'warning', { 'data-audit-code': rule.code });

			const resolvedAuditRule = resolveAuditRule(rule, originalElement);
			const tooltip = buildAuditTooltip(resolvedAuditRule, originalElement);
			const card = buildAuditCard(resolvedAuditRule, highlight, originalElement);

			// If a highlight is hovered or focused, highlight the corresponding card for it
			(['focus', 'mouseover'] as const).forEach((event) => {
				const attribute = event === 'focus' ? 'active' : 'hovered';
				highlight.addEventListener(event, () => {
					if (event === 'focus') {
						audits.forEach((audit) => {
							audit.card.removeAttribute('active');
						});
						card.scrollIntoView();
					}
					card.toggleAttribute(attribute, true);
				});
			});

			highlight.addEventListener('mouseout', () => {
				card.toggleAttribute('hovered', false);
			});

			// Set the highlight/tooltip as being fixed position the highlighted element
			// is fixed. We do this so that we don't mistakenly take scroll position
			// into account when setting the tooltip/highlight positioning.
			//
			// We only do this once due to how expensive computed styles are to calculate,
			// and are unlikely to change. If that turns out to be wrong, reconsider this.
			const { isFixed } = getElementsPositionInDocument(originalElement);
			if (isFixed) {
				tooltip.style.position = highlight.style.position = 'fixed';
			}

			attachTooltipToHighlight(highlight, tooltip, originalElement);

			canvas.append(highlight);
			audits.push({
				highlightElement: highlight,
				auditedElement: originalElement as HTMLElement,
				rule: rule,
				card: card,
			});
		}

		function buildAuditTooltip(rule: ResolvedAuditRule, element: Element) {
			const tooltip = document.createElement('astro-dev-toolbar-tooltip');
			const { title, message } = rule;

			tooltip.sections = [
				{
					icon: 'warning',
					title: escapeHtml(title),
				},
				{
					content: escapeHtml(message),
				},
			];

			const elementFile = element.getAttribute('data-astro-source-file');
			const elementPosition = element.getAttribute('data-astro-source-loc');

			if (elementFile) {
				const elementFileWithPosition =
					elementFile + (elementPosition ? ':' + elementPosition : '');

				tooltip.sections.push({
					content: elementFileWithPosition.slice(
						(window as DevToolbarMetadata).__astro_dev_toolbar__.root.length - 1 // We want to keep the final slash, so minus one.
					),
					clickDescription: 'Click to go to file',
					async clickAction() {
						// NOTE: The path here has to be absolute and without any errors (no double slashes etc)
						// or Vite will silently fail to open the file. Quite annoying.
						await fetch('/__open-in-editor?file=' + encodeURIComponent(elementFileWithPosition));
					},
				});
			}

			return tooltip;
		}

		function buildAuditCard(
			rule: ResolvedAuditRule,
			highlightElement: HTMLElement,
			auditedElement: Element
		) {
			const card = document.createElement('astro-dev-toolbar-card');

			card.shadowRoot.innerHTML = `
		<style>
		 :host>button#astro-overlay-card {
			  text-align: left;
				box-shadow: none;
				display: flex;
				flex-direction: column;
				overflow: hidden;
				gap: 8px;
			}

			:host>button#astro-overlay-card .audit-message, :host>button#astro-overlay-card .audit-description {
				display: none;
			}

			:host([active])>button#astro-overlay-card {
				position: absolute;
				height: 100%;
				top: 104px;
				height: calc(100% - 104px);
				background: #0d0e12;
				user-select: text;
				border-radius-top-left: 0;
				border-radius-top-right: 0;
				overflow: auto;
				border: none;
			}

			:host(:not([active]))>button:hover {
			  cursor: pointer;
			}

			:host([hovered])>button {
					background: rgba(136, 58, 234, 0.33);
					border: 1px solid rgba(113, 24, 226, 1)
			}

			:host([active])>button:not(:hover) {
				background: rgba(136, 58, 234, 0.13);
				border: 1px solid rgba(113, 24, 226, 1)
			}
		</style>`;

			card.clickAction = () => {
				if (card.hasAttribute('active')) return;

				audits.forEach((audit) => {
					audit.card.removeAttribute('active');
				});
				highlightElement.scrollIntoView();
				highlightElement.focus();
			};

			const auditCategory = getAuditCategory(rule);
			const auditIcon = auditCategory === 'a11y' ? 'person-arms-spread' : 'gauge';
			const iconElement = document.createElement('astro-dev-toolbar-icon');
			iconElement.icon = auditIcon;
			const auditHeader = document.createElement('div');
			auditHeader.classList.add('audit-header');
			auditHeader.appendChild(iconElement);

			const categoryBadge = document.createElement('astro-dev-toolbar-badge');
			categoryBadge.size = 'large';
			categoryBadge.textContent = categoryLabel[auditCategory];

			auditHeader.appendChild(categoryBadge);

			card.appendChild(auditHeader);

			const title = document.createElement('h3');
			title.innerText = rule.title;
			card.appendChild(title);

			const selector = document.createElement('button');
			selector.classList.add('reset-button');
			selector.classList.add('audit-selector');

			selector.innerHTML = finder(auditedElement);

			selector.addEventListener('click', () => {
				auditedElement.scrollIntoView();
				highlightElement.focus();
			});

			card.appendChild(selector);

			const extendedInfo = document.createElement('div');
			extendedInfo.classList.add('extended-info');
			extendedInfo.append(document.createElement('hr'));

			const message = document.createElement('p');
			message.classList.add('audit-message');
			message.innerHTML = rule.message;
			extendedInfo.appendChild(message);

			const description = rule.description;
			if (description) {
				const descriptionElement = document.createElement('p');
				descriptionElement.classList.add('audit-description');
				descriptionElement.innerHTML = description;
				extendedInfo.appendChild(descriptionElement);
			}

			card.appendChild(extendedInfo);

			return card;
		}

		function escapeHtml(unsafe: string) {
			return unsafe
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}
	},
} satisfies DevToolbarApp;
