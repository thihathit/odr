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

# Background

<div />
Reactivity is a fundamental idea in contemporary UI frameworks and technologies.

This idea is used by `Vue`, `React`, `Solid`, and other technologies with `unique implementations`.

### Example:

The following component color is `re-painted` upon the changes of it's `state`.

And the state is a `reactive entity` where the re-painting process could depend on.
In other words, reactive entity's `subscribers`(a.k.a: effects/watchers) will get `update` notifications
and the re-painting process could perform upon it.

<State  />

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
    console.log(`Status has been set to: ${newValue.status}`)
}

state.watch(onChange)

state.update({
    status: true
})
```

---

# Simple solution

`Observable` pattern to the rescue!

<div grid="~ cols-2 gap-4">

```ts {all|1-2|3,5,6,15|3,5,6,7|3,6,9-14|3-15|2|17-26|18|17-19,21|23-25|24|17-26|28|all|false} {maxHeight:'380px'}
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
import { createAtom } from './atom.js'

const [
  message,
  { watch, update }
] = createAtom('Hello')

console.log('Current message:', message)

watch((newMessage) => {
  console.log(newMessage)
})

<button onClick={() => {
  update((oldMessage) => `${oldMessage} World`)
}}>
  Add "World"
</button>
```

<div v-after="19">
<AtomDemo />
</div>
</div>

</div>

<!--
1. please snapshot/clone `data` for storing
-->

---

# Writing react adapter

<div grid="~ cols-2 gap-4">

<div>

#### Custom hook

```js {1-15,20|1,3,5,7|7,4,9-13|4,7,15,|3,4,16-19|1-15,20|false}
export const useAtom = atom => { // for createAtom
  const [
    data,
    { watch, ...rest }
  ] = atom

  const [state, setState] = useState(data)

  useEffect(() => {
    const cleanup = watch(setState)

    return cleanup
  }, [])

  return [ state, rest ]
  return [
    state: useSyncExternalStore(watch, () => data),
    rest
  ]
}
```
</div>

<div>

#### Usage

```jsx {false|2-4|2-7|1,7,13|9-11,15}
import { useEffect } from 'react'
import { createAtom, useAtom } from './atom.js'

const atom = createAtom('Hello')

const MyComponent = () => {
  const [ message, { update } ] = useAtom(atom)

  const addWorld = () => {
    update((oldMessage) => `${oldMessage} World`)
  }

  useEffect(() => console.log(message), [message])

  return <button onClick={addWorld}>Add "World"</button>
}
```
<div v-after="10">
<AtomDemo />
</div>
</div>
</div>

---

# Advanced solution

Leverage `ES6 Proxy` for better DX, performance & control.

Background: `Proxy` allows you intercept the property and manipulate it.

```js {1|1-2|3,4,7|3,4,7,8|6,7|11,12,13|2,11|4,12|7,13|all}
const originalData = { hello: 'friend', other: 'other' }
const data = new Proxy(originalData, {
    get: (target, keyName)=> {
        if(keyName == 'hello') return 'world'

        // same as: Reflect.get(target, keyName)
        return target[keyName]
    }
});

console.log(data) // Proxy object
console.log(data.hello) // world
console.log(data.other) // other
```

So we will be using it in combination with other patterns.

---

#### Implementation

Note: this implementation doesn't support nested objects.

```js {all|1|6|33|8|9,18|9,16|18|19|18,20,30|6|18,19,22-25,27,28|26,33|40-42|4|4,9,13,14|41|35,37-39|46-55|44|57|all} {maxHeight:'380px'}
export const toReactive = data => {
  // Symbols, used to ask proxied object to return different values
  const $REACTIVE = Symbol('reactive flag')
  const $RAW = Symbol('raw value')

  const watchers = []

  const handler = {
    get: (target, key, receiver) => {
      // Flag to verify if the object is proxy/reactive
      if (key == $REACTIVE) return true

      // Return original value when accessed using $RAW Symbol
      if (key == $RAW) return target

      return Reflect.get(target, key, receiver)
    },
    set: (target, key, newValue, receiver) => {
      const previousValue = Reflect.get(target, key, receiver)
      const result = Reflect.set(target, key, newValue, receiver)

      watchers.forEach(notify => {
        notify({
          previousValue,
          newValue,
          data: toRaw(proxy)
        })
      })

      return result
    }
  }
  const proxy = new Proxy(data, handler)

  const isReactive = maybeReactive => {
    if (typeof maybeReactive !== 'object') return false

    return maybeReactive[$REACTIVE] === true
  }
  const toRaw = maybeReactive => {
    return isReactive(maybeReactive) ? maybeReactive[$RAW] : maybeReactive
  }

  const toPlainData = () => toRaw(proxy)

  const registerWatcher = watcher => {
    watchers.push(watcher)

    // Clean up method
    return () => {
      const index = watchers.indexOf(watcher)

      watchers.splice(index, 1)
    }
  }

  return [proxy, registerWatcher, toPlainData]
}
```

---

#### Usage


<div grid="~ cols-2 gap-4">

```tsx {1-6|3,8-10|12-15|4,12,13,15|5,12,14,15|12-19|all} {lines:true}
import { toReactive } from './reactive.js'

const [state, watch] = toReactive({
  count: 0,
  status: false
})

watch(({ data }) => {
  console.log(data)
})

const onClick = () => {
  state.count++
  state.status = !state.status
}

<button onClick={onClick}>
  Update
</button>
```

<div v-after="5">
<ReactiveDemo />
</div>
</div>

---

# Source

- Web: [odr.netlify.app](https://odr.netlify.app/)
- Github repo: [thihathit/odr](https://github.com/thihathit/odr).
- Examples: [./libs](https://github.com/thihathit/odr/tree/main/libs/).
  - Atom: [./atom.js](https://github.com/thihathit/odr/tree/main/libs/atom.ts).
  - Proxy: [./reactive.js](https://github.com/thihathit/odr/tree/main/libs/reactive.js).
  - Other proxy implementations:
    - Nested: [./nested-reactive.ts](https://github.com/thihathit/odr/tree/main/libs/nested-reactive.ts).
    - Atomic: [./atomic-reactive.ts](https://github.com/thihathit/odr/tree/main/libs/atomic-reactive.ts).

<div class="absolute bottom-10">
    Thank you.
</div>