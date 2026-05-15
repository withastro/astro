import { settings } from '../../../settings.js';
import { a11y } from './a11y.js';
import { perf } from './perf.js';
const rulesCategories = [
	{ code: 'a11y', name: 'Accessibility', icon: 'person-arms-spread', rules: a11y },
	{ code: 'perf', name: 'Performance', icon: 'gauge', rules: perf },
];
const dynamicAuditRuleKeys = ['title', 'message', 'description'];
function resolveAuditRule(rule, element) {
	let resolved = { ...rule };
	for (const key of dynamicAuditRuleKeys) {
		const value = rule[key];
		if (typeof value === 'string') continue;
		try {
			if (!value) {
				resolved[key] = '';
				continue;
			}
			resolved[key] = value(element);
		} catch (err) {
			settings.logger.error(`Error resolving dynamic audit rule ${rule.code}'s ${key}: ${err}`);
			resolved[key] = 'Error resolving dynamic rule';
		}
	}
	return resolved;
}
function getAuditCategory(rule) {
	return rule.code.split('-')[0];
}
const categoryLabel = {
	perf: 'performance',
	a11y: 'accessibility',
};
export { categoryLabel, getAuditCategory, resolveAuditRule, rulesCategories };
