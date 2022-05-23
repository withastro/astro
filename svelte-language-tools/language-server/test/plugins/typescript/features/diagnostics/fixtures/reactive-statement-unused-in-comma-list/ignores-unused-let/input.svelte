<!-- offsetting script... -->
<script lang="ts">
    let x: any;
    let y: any;

    const update = () => {};

    $: x, update();

    $: x, y, update();

    $: {
        x;
        x, y;
        update();
    }
</script>
