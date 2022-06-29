import { parseHTML } from 'linkedom'
import { transformSlots, SLOT_PREFIX } from './slots.js';
import { transformAssets, ASSET_PREFIX } from './assets.js';

export function transform(code: string, id: string) {
	const { document } = parseHTML(code)
	transformSlots(document);
	const importText = transformAssets(document, id);
	return `${importText}\n\nconst ___CODE___ = ({ ['@astrojs/html']: true, render({ slots: ${SLOT_PREFIX} }) { return \`${document.toString().replace(/`/g, '\\`').replace(/\${(?!___(SLOTS|ASSET))/g, '\\${')}\` }});\nexport default ___CODE___;`
}
