<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  status: false
})

const onClick = () => {
  state.count++
  state.status = !state.status
}
</script>

<template>
  <div :class="styles.parent" class="mt-3">
    Demo:
    <button
      @click="onClick"
      :class="styles.btn"
      class="outline outline-1 rounded"
    >
      Update
    </button>
    <pre>{{ state }}</pre>
  </div>
</template>

<style scoped module="styles">
.parent {
  font-size: 0.7em;
}

.btn {
  padding: 3px 8px;
}
</style>
