<script setup lang="ts">
import { ref } from 'vue'
import { createAtom } from '../libs/atom'

const [currentValue, { watch, update }] = createAtom('Hello')

const message = ref(currentValue)

watch(newMessage => {
  message.value = newMessage
})

const onClick = () => {
  update(oldMessage => `${oldMessage} World`)
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
      Add "World"
    </button>
    <pre>{{ message }}</pre>
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
