import { escape as escapeHTML } from 'html-escaper';
import {
	attachTooltipToHighlight,
	createHighlight,
	getElementsPositionInDocument,
} from '../../utils/highlight.js';
import { getAnnotationsForElement } from '../annotations.js';
import { resolveAuditRule } from '../rules/index.js';
function truncate(val, maxLength) {
	return val.length > maxLength ? val.slice(0, maxLength - 1) + '&hellip;' : val;
}
function createAuditUI(audit, audits) {
	const rect = audit.auditedElement.getBoundingClientRect();
	const highlight = createHighlight(rect, 'warning', { 'data-audit-code': audit.rule.code });
	const resolvedAuditRule = resolveAuditRule(audit.rule, audit.auditedElement);
	const tooltip = buildAuditTooltip(resolvedAuditRule, audit.auditedElement);
	const card = buildAuditCard(resolvedAuditRule, highlight, audit.auditedElement, audits);
	['focus', 'mouseover'].forEach((event) => {
		const attribute = event === 'focus' ? 'active' : 'hovered';
		highlight.addEventListener(event, () => {
			if (event === 'focus') {
				audits.forEach((adt) => {
					if (adt.card) adt.card.toggleAttribute('active', false);
				});
				if (!card.isManualFocus) card.scrollIntoView();
				card.toggleAttribute('active', true);
			} else {
				card.toggleAttribute(attribute, true);
			}
		});
	});
	highlight.addEventListener('mouseout', () => {
		card.toggleAttribute('hovered', false);
	});
	const { isFixed } = getElementsPositionInDocument(audit.auditedElement);
	if (isFixed) {
		tooltip.style.position = highlight.style.position = 'fixed';
	}
	attachTooltipToHighlight(highlight, tooltip, audit.auditedElement);
	return { highlight, card };
}
function buildAuditTooltip(rule, element) {
	const tooltip = document.createElement('astro-dev-toolbar-tooltip');
	const { title, message } = rule;
	tooltip.sections = [
		{
			icon: 'warning',
			title: escapeHTML(title),
		},
		{
			content: escapeHTML(message),
		},
	];
	const { file: elementFile, location: elementPosition } = getAnnotationsForElement(element) ?? {};
	if (elementFile) {
		const elementFileWithPosition = elementFile + (elementPosition ? ':' + elementPosition : '');
		tooltip.sections.push({
			content: elementFileWithPosition.slice(
				window.__astro_dev_toolbar__.root.length - 1,
				// We want to keep the final slash, so minus one.
			),
			clickDescription: 'Click to go to file',
			async clickAction() {
				await fetch('/__open-in-editor?file=' + encodeURIComponent(elementFileWithPosition));
			},
		});
	}
	return tooltip;
}
function buildAuditCard(rule, highlightElement, auditedElement, audits) {
	const card = document.createElement('astro-dev-toolbar-audit-list-item');
	card.clickAction = () => {
		if (card.hasAttribute('active')) return;
		audits.forEach((audit) => {
			audit.card?.toggleAttribute('active', false);
		});
		highlightElement.scrollIntoView();
		card.isManualFocus = true;
		highlightElement.focus();
		card.isManualFocus = false;
	};
	const selectorTitleContainer = document.createElement('section');
	selectorTitleContainer.classList.add('selector-title-container');
	const selector = document.createElement('span');
	const selectorName = truncate(auditedElement.tagName.toLowerCase(), 8);
	selector.classList.add('audit-selector');
	selector.innerHTML = escapeHTML(selectorName);
	const title = document.createElement('h3');
	title.classList.add('audit-title');
	title.innerText = rule.title;
	selectorTitleContainer.append(selector, title);
	card.append(selectorTitleContainer);
	const extendedInfo = document.createElement('div');
	extendedInfo.classList.add('extended-info');
	const selectorButton = document.createElement('button');
	selectorButton.className = 'audit-selector reset-button';
	selectorButton.innerHTML = `${selectorName} <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M128,136v64a8,8,0,0,1-16,0V155.32L45.66,221.66a8,8,0,0,1-11.32-11.32L100.68,144H56a8,8,0,0,1,0-16h64A8,8,0,0,1,128,136ZM208,32H80A16,16,0,0,0,64,48V96a8,8,0,0,0,16,0V48H208V176H160a8,8,0,0,0,0,16h48a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Z"></path></svg>`;
	selectorButton.addEventListener('click', () => {
		highlightElement.scrollIntoView();
		highlightElement.focus();
	});
	extendedInfo.append(title.cloneNode(true));
	extendedInfo.append(selectorButton);
	extendedInfo.append(document.createElement('hr'));
	const message = document.createElement('p');
	message.classList.add('audit-message');
	message.innerHTML = simpleRenderMarkdown(rule.message);
	extendedInfo.appendChild(message);
	const description = rule.description;
	if (description) {
		const descriptionElement = document.createElement('p');
		descriptionElement.classList.add('audit-description');
		descriptionElement.innerHTML = simpleRenderMarkdown(description);
		extendedInfo.appendChild(descriptionElement);
	}
	card.shadowRoot.appendChild(extendedInfo);
	return card;
}
const linkRegex = /\[([^[]+)\]\((.*)\)/g;
const boldRegex = /\*\*(.+)\*\*/g;
const codeRegex = /`([^`]+)`/g;
function simpleRenderMarkdown(markdown) {
	return escapeHTML(markdown)
		.replace(linkRegex, `<a href="$2" target="_blank">$1</a>`)
		.replace(boldRegex, '<b>$1</b>')
		.replace(codeRegex, '<code>$1</code>');
}
export { createAuditUI };
