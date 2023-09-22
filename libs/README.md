# Usage

## Nested

```ts
import { toReactive } from './nested-reactive'

const reactiveBtn = document.querySelector('.button')!
const [reactive, watch] = toReactive({
  one: {
    count: 0,
    status: false,
    two: {
      status: true,
      three: {
        status: true
      }
    }
  }
})

watch(({ newValue }) => {
  console.log(newValue)
})

const onReactiveClick = () => {
  reactive.one.two.status = !reactive.one.two.status
  reactive.one.count++
  reactive.one.status = !reactive.one.status
}

reactiveBtn.addEventListener('click', onReactiveClick)
```

## Atomic

```ts
import { toReactive, watch } from './atomic-reactive'

const reactiveBtn = document.querySelector('.button')!
const reactive = toReactive({
  one: {
    count: 0,
    status: false,
    two: {
      status: true,
      three: {
        status: true
      }
    }
  }
})

watch(reactive.one, ({ newValue }) => {
  console.log(newValue)
})

watch(reactive.one.two, ({ newValue }) => {
  console.log(newValue)
})

const onReactiveClick = () => {
  reactive.one.two.status = !reactive.one.two.status
  reactive.one.count++
  reactive.one.status = !reactive.one.status
}

reactiveBtn.addEventListener('click', onReactiveClick)
```