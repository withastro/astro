<script lang="ts">
	let right = 'string';
	let wrong = true;
</script>

<!-- ok -->
<div style:right />
<div style:right={right} />
<div style:right={12} />
<div style:right="right" />
<div style:right={`right${right}`} />
<div style:right=right{right} />
<div style:undefined={undefined} />
<div style:null={null} />

<!-- error -->
<div style:wrong />
<div style:wrong={wrong} />
