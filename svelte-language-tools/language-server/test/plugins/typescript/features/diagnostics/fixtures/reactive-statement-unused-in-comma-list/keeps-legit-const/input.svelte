<!-- offsetting script... -->
<script lang="ts">
    let x: any;
    const y = 123;
    const update = () => {};

    $: y, update();
    $: x, y, update();
    $: y, x, update();

    $: {
        y;
        x, y; // the y here should be warned, ideally, but TS doesn't catch that apparently...
        y, x;
        update();
    }
</script>
