<script lang="ts">
    let bar = "bar";
</script>

<!-- valid -->
<div data-foo data-bar={bar} />
<div class={bar} />

<!-- invalid -->
<div this-is="wrong" />
<div {bar} />
