---
highlighter: prism
transition: fade-out
title: On-demand Reactivity
info: |
  ## On-demand Reactivity
  Writing custom reactive engines.
mdc: true
layout: intro
---

# On-demand Reactivity

Writing custom reactive engines outside of React components.

<div class="absolute bottom-10">
    Thiha Thit — reactx.camp
</div>

---

# What we usually want?

Let's say we have the following state.

```ts
const state = {
    status: true
}
```

And whenever the properties are updated, it should fire events or notifications.

So our event listener would look something like this.

```ts
const onChange = (newValue) => {
    alert(`Status has been set to: ${newValue.status}`)
}

state.watch(onChange)

state.update({
    status: true
})
```

---

# Simple solution

Observable pattern to the rescue!

<div grid="~ cols-2 gap-2" m="-t-2">

```ts {all|1-2|3,5,6,15|3,5,6,7|3,6,9-14|3-15|2|17-26|18|17-19,21|23-25|24|17-26|28|all} {maxHeight:'380px'}
export const createAtom = data => {
  const store = { data }
  const watchers = []

  // Store callback functions
  const watch = watcher => {
    watchers.push(watcher)

    const cleanup = () => {
      const index = watchers.indexOf(watcher)
      watchers.splice(index, 1)
    }

    return cleanup
  }

  const update = newData => {
    const previousValue = store.data
    const newValue = newData(previousValue)

    store.data = newValue

    watchers.forEach(notify =>
      notify(newValue, previousValue)
    )
  }

  return [store.data, { update, watch }]
}
```

<div>
```tsx {false|1-6|4,8|5,10-12|5,14-18|all} {maxHeight:'280px'}
import { createAtom } from './atom.ts'

const [
  message,
  { watch, update }
] = createAtom('Hello')

console.log('Current message:', message)

watch((newMessage) => {
  alert(newMessage)
})

<button onClick={() => {
  update((oldMessage) => `${oldMessage} World`)
}}>
  Add "World"
</button>
```

<div v-after="18">
<AtomDemo />
</div>
</div>

</div>

<!--
1. please snapshot/clone `data` for storing
-->
