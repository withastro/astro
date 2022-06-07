<template>
  <div :id="id" class="counter">
    <h1><slot /></h1>
    <button class="decrement" @click="subtract()">-</button>
    <Result :value="count" />
    <button class="increment" @click="add()">+</button>
  </div>
</template>

<script>
import { ref } from 'vue';

import Result from './Result.vue';

export default {
  components: {
    Result
  },
  props: {
		id: {
			type: String,
			required: true
		},
    start: {
      type: String,
      required: true
    },
    stepSize: {
      type: String,
      default: "1"
    }
  },
  setup(props) {
		const id = props.id;
    const count = ref(parseInt(props.start))
    const stepSize = ref(parseInt(props.stepSize))
    const add = () => (count.value = count.value + stepSize.value);
    const subtract = () => (count.value = count.value - stepSize.value);
    return {
      count,
			id,
      add,
      subtract,
    };
  },
};
</script>

<style>
.counter {
	display: grid;
	font-size: 2em;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	margin-top: 2em;
	place-items: center;
}
</style>
