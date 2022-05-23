<script lang="ts">
	import Component from './untyped-ts.svelte'
</script>

<Component typedAsAny={undefined} untyped={undefined} />
<Component typedAsAny={null} untyped={null} />
<Component typedAsAny={true} untyped={true} />
<Component typedAsAny={123} untyped={123} />
<Component typedAsAny='string' untyped='string' />
<Component typedAsAny={{some: 'object'}} untyped={{some: 'object'}} />
<Component typedAsAny={['string', 'array']} untyped={['string', 'array']} />
<Component typedAsAny={['array', 123, false]} untyped={['array', 123, false]} />
<Component typedAsAny={['array', 123, false]} untyped={['array', 123, false]} />
