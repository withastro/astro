<script>
    import HoverEventsInterface from './hover-events-interface.svelte';

    /** Documentation string */
    const withDocs = true

    const withoutDocs = true

    /**@author foo */
    const withJsDocTag = true;
</script>

<HoverEventsInterface on:abc="{e => e}" />
