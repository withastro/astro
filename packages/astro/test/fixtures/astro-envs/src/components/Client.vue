<template>
  <div id="client-component">
    {{ PUBLIC_PLACE }}
  </div>
	<div id="client-mode">
		{{ MODE }}
	</div>
</template>

<script>
export default {
  data() {
    return {
      PUBLIC_PLACE: import.meta.env.PUBLIC_PLACE,
			SECRET_PLACE: import.meta.env.SECRET_PLACE,
			MODE: import.meta.env.MODE,
    };
  },
};
</script>
