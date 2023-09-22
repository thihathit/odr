// Symbols, used to ask proxied objects to return different values
const $REACTIVE = Symbol('reactive flag')
const $RAW = Symbol('raw value')

type ReactiveFlags = {
  [$REACTIVE]: boolean
  [$RAW]: object
}
type Reactive<T extends object> = T & ReactiveFlags
type Raw<T> = T extends Reactive<infer U> ? U : T

const isReactive = <T>(reactive: T) => {
  if (typeof reactive !== 'object') return false

  const value = reactive as never as Reactive<object>

  return !!value[$REACTIVE]
}

const toRaw = <T extends Reactive<object>>(reactive: T) => {
  const rawData = isReactive(reactive) ? reactive[$RAW] : reactive

  const clonedRawData: Partial<T> = {}

  for (const key in rawData) {
    // @ts-ignore
    const value = rawData[key]

    if (isReactive(value)) {
      // @ts-ignore
      clonedRawData[key] = toRaw(value)

      continue
    }

    // @ts-ignore
    clonedRawData[key] = value
  }

  return clonedRawData as Raw<T>
}

// Supports nested objects
export const toReactive = <D extends object>(data: D) => {
  type Data = typeof data
  type ReactiveData = Reactive<D>

  type Watcher = <N, O>(values: {
    newValue: N
    previousValue: O
    data: Raw<ReactiveData>
  }) => void

  const watchables: Watcher[] = []

  const createProxy = (target: D) => {
    const clonedTarget: Partial<D> = {}

    for (const key in target) {
      const value = target[key]

      // @ts-ignore
      const isObject = typeof value == 'object' && !isReactive(value)

      if (isObject) {
        // @ts-ignore
        clonedTarget[key] = createProxy(value)

        continue
      }

      clonedTarget[key] = value
    }

    return new Proxy(clonedTarget, handler) as ReactiveData
  }

  const handler: ProxyHandler<Data> = {
    get: (target, key, receiver) => {
      // Flag to verify if the object is proxy/reactive
      if (key == $REACTIVE) return true

      // Return original value when accessed using $RAW Symbol
      if (key == $RAW) return target

      return Reflect.get(target, key, receiver)
    },
    set: (target, key, value, receiver) => {
      const oldValue = Reflect.get(target, key, receiver)

      const result = Reflect.set(target, key, value, receiver)

      const previousValue = toRaw(oldValue as never)

      watchables.forEach(fire => {
        fire({
          previousValue,
          newValue: value,
          data: toRaw(proxy)
        })
      })

      return result
    }
  }

  const proxy = createProxy(data)

  const registerWatcher = (watcher: Watcher) => {
    watchables.push(watcher)

    // Clean up method
    return () => {
      const index = watchables.indexOf(watcher)

      watchables.splice(index, 1)
    }
  }

  return [proxy, registerWatcher] as const
}
