import type { DevOverlayItem } from '../../../../@types/astro.js';
import type { DevOverlayTooltip } from '../ui-toolkit.js';

export default {
	id: 'astro:xray',
	name: 'Xray',
	icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="#fff" d="M7.875 1.5v-.375c0-.298369.11853-.584517.3295-.795495C8.41548.118526 8.70163 0 9 0c.29837 0 .58452.118526.7955.329505.211.210978.3295.497126.3295.795495V1.5c0 .29837-.1185.58452-.3295.7955-.21098.21097-.49713.3295-.7955.3295-.29837 0-.58452-.11853-.7955-.3295-.21097-.21098-.3295-.49713-.3295-.7955ZM1.5 10.125c.29837 0 .58452-.1185.7955-.3295.21097-.21098.3295-.49713.3295-.7955 0-.29837-.11853-.58452-.3295-.7955-.21098-.21097-.49713-.3295-.7955-.3295h-.375c-.298369 0-.584517.11853-.795495.3295C.118526 8.41548 0 8.70163 0 9c0 .29837.118526.58452.329505.7955.210978.211.497126.3295.795495.3295H1.5Zm10.5187-6.43313c.1402.04674.2882.0654.4356.05493.1474-.01046.2912-.04986.4234-.11594.1321-.06607.25-.15753.3468-.26916.0968-.11162.1707-.24122.2174-.38139l.375-1.125c.084-.28016.0555-.58202-.0793-.84158-.1348-.259563-.3654-.45642-.6429-.548838-.2775-.092417-.58-.07313-.8436.053773-.2635.126903-.4672.351445-.568.626025l-.375 1.125c-.0941.28283-.0721.59146.0611.85812.1332.26665.3669.46952.6495.56406ZM2.26875 11.3081l-1.125.375c-.144256.0433-.27836.115-.394363.2111-.116003.096-.211543.2144-.280956.348-.069412.1337-.111285.2799-.123135.43-.01185.1502.006564.3011.054149.444.047586.1429.123375.2748.222875.3878.099499.1131.220683.205.356368.2703.135682.0654.283112.1028.433532.1101.15042.0073.30078-.0156.44216-.0675l1.125-.375c.14425-.0433.27836-.115.39436-.2111.116-.096.21154-.2144.28095-.348.06942-.1337.11129-.2799.12314-.43.01185-.1502-.00656-.3011-.05415-.444-.04759-.1429-.12338-.2748-.22287-.3878-.0995-.1131-.22069-.205-.35637-.2703-.13569-.0654-.28311-.1028-.43353-.1101-.15042-.0073-.30078.0156-.44216.0675Zm18.55595 5.6766c.1742.1741.3124.3808.4066.6084.0943.2275.1428.4714.1428.7177 0 .2463-.0485.4902-.1428.7177-.0942.2275-.2324.4343-.4066.6084l-1.1888 1.1887c-.1741.1742-.3808.3124-.6084.4067-.2275.0942-.4714.1428-.7177.1428-.2462 0-.4901-.0486-.7177-.1428-.2275-.0943-.4342-.2325-.6084-.4067l-4.2665-4.2665-1.6041 3.6909c-.1436.3349-.3826.6201-.6872.8201-.3045.2001-.66121.3061-1.02559.3049h-.09375c-.3792-.0165-.74423-.1489-1.04594-.3792-.30172-.2303-.52562-.5475-.64156-.9089L2.71875 5.0775c-.10548-.32823-.11842-.6792-.0374-1.01431s.25287-.64139.49666-.88518c.24379-.24379.55007-.41564.88518-.49666.33511-.08102.68608-.06808 1.01431.0374L20.085 7.61906c.3591.11962.6736.34511.9021.64684.2286.30172.3604.66555.3783 1.04363.0178.37808-.0792.75267-.2782 1.07467-.1991.3219-.491.576-.8372.7289l-3.6909 1.605 4.2656 4.2666Zm-1.8563 1.3256-4.3903-4.3912c-.2158-.2161-.3755-.4817-.4653-.7736-.0898-.2919-.1069-.6013-.0499-.9013.057-.3001.1864-.5816.377-.8202.1906-.2387.4366-.4271.7167-.549l3.2812-1.42594L5.08969 5.08969 9.44812 18.4369l1.42598-3.2813c.122-.28.3105-.5259.5492-.7164.2388-.1905.5204-.3198.8205-.3767.1155-.0224.2329-.0337.3506-.0338.4969.0004.9733.198 1.3247.5494l4.3912 4.3913.6581-.6591Z"/></svg>',
	init(canvas) {
		const islands = document.querySelectorAll<HTMLElement>('astro-island');

		islands.forEach((island) => {
			const el = document.createElement('div');
			el.style.position = 'absolute';

			const rect = island.children[0]
				? island.children[0].getBoundingClientRect()
				: island.getBoundingClientRect();

			el.style.top = `${Math.max(rect.top - 10, 0)}px`;
			el.style.left = `${Math.max(rect.left - 10, 0)}px`;
			el.style.width = `${rect.width + 15}px`;
			el.style.height = `${rect.height + 15}px`;

			el.innerHTML = `
				<astro-overlay-highlight></astro-overlay-highlight>
			`;

			const islandProps = island.getAttribute('props')
				? JSON.parse(island.getAttribute('props')!)
				: {};
			const islandClientDirective = island.getAttribute('client');

			const tooltip = document.createElement('astro-overlay-tooltip') as DevOverlayTooltip;
			tooltip.sections = [];

			if (islandClientDirective) {
				tooltip.sections.push({
					title: 'Client directive',
					content: `client:${islandClientDirective}`,
				});
			}

			if (Object.keys(islandProps).length > 0) {
				tooltip.sections.push({
					title: 'Props',
					content: `${Object.entries(islandProps)
						.map((prop) => `<code>${prop[0]}="${getPropValue(prop[1] as any)}"</code>`)
						.join(', ')}`,
				});
			}

			tooltip.sections.push({
				content: '/src/somewhere/component.astro',
				clickDescription: 'Click to go to file',
				clickAction() {
					// TODO: Implement this
				},
			});

			tooltip.style.position = 'absolute';
			tooltip.style.top = `${rect.height}px`;
			tooltip.style.left = `${Math.max(rect.left - 10, 5)}px`;
			tooltip.style.margin = '0';

			el.appendChild(tooltip);

			el.addEventListener('mouseover', () => {
				tooltip.dialog.show();
			});

			el.addEventListener('mouseout', () => {
				tooltip.dialog.close();
			});

			canvas.appendChild(el);
		});

		function getPropValue(prop: [number, any]) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [_, value] = prop;
			return JSON.stringify(value, null, 2);
		}
	},
} satisfies DevOverlayItem;
