---
layout: ../layouts/content.astro
setup: import SlotComponent from '../components/SlotComponent.astro';
---

# Component with slot contents in children

<SlotComponent>
	<div>4: Div in default slot</div>
	<Fragment slot="fragmentSlot">
		<div>1: Div in fragmentSlot</div>
		<p>2: Paragraph in fragmentSlot</p>
	</Fragment>
	<Fragment><p>5: Paragraph in fragment in default slot</p></Fragment>
	6: Regular text in default slot
	<p slot="pSlot" title="hello">3: p with title as pSlot</p>
</SlotComponent>

# Component with nested component in children

<SlotComponent>
	<p slot="pSlot">2: pSlot</p>
	<SlotComponent>
		<p slot="pSlot">4: nested pSlot</p>
		5: nested text in default slot
		<Fragment slot="fragmentSlot">3: nested fragmentSlot</Fragment>
	</SlotComponent>
	<Fragment slot="fragmentSlot">1: fragmentSlot</Fragment>
</SlotComponent>

# Missing content due to empty children

<SlotComponent>
</SlotComponent>

# Missing content due to self-closing tag

<SlotComponent/>
