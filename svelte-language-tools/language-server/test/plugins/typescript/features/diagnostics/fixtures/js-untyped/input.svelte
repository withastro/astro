<script lang="ts">
    import Untyped from './untyped-js.svelte';
</script>

<Untyped untyped={true} let:untyped>{untyped.worksBecauseAny}</Untyped>