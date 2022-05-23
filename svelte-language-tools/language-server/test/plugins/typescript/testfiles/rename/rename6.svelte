<script lang="ts">
  function action(_: any, props: {foo: number}) {}

  const foo = 1;
  action(null, {foo});
</script>

<div use:action={{foo}} />
