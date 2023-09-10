<script setup lang="ts">
import { createAtom } from '../libs/atom'

const [, { watch, update }] = createAtom('Hello')

watch(newMessage => {
  alert(newMessage)
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
