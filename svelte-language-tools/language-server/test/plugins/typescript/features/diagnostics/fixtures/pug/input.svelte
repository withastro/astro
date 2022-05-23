<script lang="ts">
   import Foo from '.';
   import { A, B, C } from '.';

   const a: string | number = true;
</script>

<template lang="pug">
+if('typeof a === "number"')
  A(a='{a.toFixed(2)}')
</template>
