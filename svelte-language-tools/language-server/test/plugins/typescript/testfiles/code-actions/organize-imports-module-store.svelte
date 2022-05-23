<script context="module">
  import { _ } from 'svelte-i18n';
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { _d } from 'svelte-i18n';
  import { _e } from 'svelte-i18n1';
</script>

<p>{$_('test')}</p>
<p>{$_d('test')}</p>
<p>{$_e('test')}</p>
