<!-- offsetting script... -->
<script lang="ts">
    import { y } from 'whatever';

    let x: any;
    const update = () => {};

    $: y, update();
    $: x, y, update();
    $: y, x, update();

    $: {
        y; // the y here should be warned, ideally, but TS doesn't catch that apparently...
        x, y; // same here...
        y, x;
        update();
    }
</script>
