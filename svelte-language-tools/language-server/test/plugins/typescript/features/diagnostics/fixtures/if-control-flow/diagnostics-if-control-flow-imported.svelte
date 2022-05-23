<script lang="ts">
    const foo: string | boolean = '' as any;
</script>

<slot {foo} b={foo} />
