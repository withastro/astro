<template>
  <h1>Vue</h1>
  <ul>
    <li v-for="user in list" :key="user.name">
      {{JSON.stringify(user, null, 2)}}
    </li>
  </ul>
  <div>
    <h3>Counter</h3>
    <p>{{count}}</p>
    <button @click="decreaseCounter">-1</button>
    <button @click="increaseCounter">+1</button>
  </div>
  <br />
</template>

<script>
  import { useStore } from 'nanostores/vue'

  import { admins } from '../store/admins.js'
  import { counter, increaseCounter, decreaseCounter } from '../store/counter.js'

  export default {
    setup() {
      const list = useStore(admins)
      const count = useStore(counter)
      return { list, count, increaseCounter, decreaseCounter }
    }
  }
</script>
