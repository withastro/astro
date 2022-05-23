<script lang="typescript">
import {blubb} from './definitions';
import ImportedFile from './imported-file.svelte';
function bla() {return true;}
bla();
blubb();
let store = null;
$store;
if ($store) {}
$blubb;
if ($blubb) {}
</script>
<ImportedFile></ImportedFile>
{$store}
{#if $store}
{/if}
{$blubb}
{#if $blubb}
{/if}