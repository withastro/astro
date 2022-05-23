<script lang="ts">
    import { getDefaultSomeType, SomeType } from './some-type';

    export let someType: SomeType = getDefaultSomeType();

    let foo: SomeType = {
        hi: 'bar'
    }
</script>