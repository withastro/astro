import { renderSlotToString } from '../../runtime/server/index.js';
import { renderJSX } from '../../runtime/server/jsx.js';
import { isRenderTemplateResult } from '../../runtime/server/render/astro/index.js';
import { chunkToString } from '../../runtime/server/render/index.js';
import { isRenderInstruction } from '../../runtime/server/render/instruction.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
function getFunctionExpression(slot) {
	if (!slot) return;
	const expressions = slot?.expressions?.filter(
		(e) => isRenderInstruction(e) === false || isRenderTemplateResult(e),
	);
	if (expressions?.length !== 1) return;
	const expression = expressions[0];
	if (isRenderTemplateResult(expression)) {
		return getFunctionExpression(expression);
	}
	return expression;
}
class Slots {
	#result;
	#slots;
	#logger;
	constructor(result, slots, logger) {
		this.#result = result;
		this.#slots = slots;
		this.#logger = logger;
		if (slots) {
			for (const key of Object.keys(slots)) {
				if (this[key] !== void 0) {
					throw new AstroError({
						...AstroErrorData.ReservedSlotName,
						message: AstroErrorData.ReservedSlotName.message(key),
					});
				}
				Object.defineProperty(this, key, {
					get() {
						return true;
					},
					enumerable: true,
				});
			}
		}
	}
	has(name) {
		if (!this.#slots) return false;
		return Boolean(this.#slots[name]);
	}
	async render(name, args = []) {
		if (!this.#slots || !this.has(name)) return;
		const result = this.#result;
		if (!Array.isArray(args)) {
			this.#logger.warn(
				null,
				`Expected second parameter to be an array, received a ${typeof args}. If you're trying to pass an array as a single argument and getting unexpected results, make sure you're passing your array as an item of an array. Ex: Astro.slots.render('default', [["Hello", "World"]])`,
			);
		} else if (args.length > 0) {
			const slotValue = this.#slots[name];
			const component = typeof slotValue === 'function' ? await slotValue(result) : await slotValue;
			const expression = getFunctionExpression(component);
			if (expression) {
				const slot = async () =>
					typeof expression === 'function' ? expression(...args) : expression;
				return await renderSlotToString(result, slot).then((res) => {
					return res;
				});
			}
			if (typeof component === 'function') {
				return await renderJSX(result, component(...args)).then((res) =>
					res != null ? String(res) : res,
				);
			}
		}
		const content = await renderSlotToString(result, this.#slots[name]);
		const outHTML = chunkToString(result, content);
		return outHTML;
	}
}
export { Slots };
