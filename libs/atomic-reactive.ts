// Symbols, used to ask proxied objects to return different values
const $REACTIVE = Symbol('reactive flag')
const $RAW = Symbol('raw value')
const $WATCHABLES = Symbol('atomic watchables')

type ReactiveFlags<T extends object> = {
  [$REACTIVE]: boolean
  [$RAW]: T
}

type Reactive<T extends object> = {
  [K in keyof T]: T[K] extends object ? Reactive<T[K]> : T[K]
} & ReactiveFlags<T>

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

export const toReactive = <Data extends object>(data: Data) => {
  type RWatcher = {
    reactive: Reactive<Data>
    fire: (values: { newValue: unknown; previousValue: unknown }) => void
  }
  type RWatchables = RWatcher[]

  const watchables: RWatchables = []

  const createProxy = <T extends Data>(target: T) => {
    const clonedTarget: Partial<T> = {}

    for (const key in target) {
      const value = target[key]

      const isObject = typeof value == 'object' && !isReactive(value)

      if (isObject) {
        // @ts-ignore
        clonedTarget[key] = createProxy(value)

        continue
      }

      clonedTarget[key] = value
    }

    const handler: ProxyHandler<T> = {
      get: (target, key, receiver) => {
        // Flag to verify if the object is proxy/reactive
        if (key == $REACTIVE) return true

        // Return original value when accessed using $RAW Symbol
        if (key == $RAW) return target

        if (key == $WATCHABLES) return watchables

        return Reflect.get(target, key, receiver)
      },
      set: (target, key, value, receiver) => {
        const targetedWatchables = watchables.filter(
          ({ reactive }) => reactive == receiver
        )

        const withPrevious = targetedWatchables.map(
          ({ reactive, ...rest }) => ({
            reactive,
            previousValue: toRaw(reactive),
            ...rest
          })
        )

        const result = Reflect.set(target, key, value, receiver)

        const withNew = withPrevious.map(({ reactive, ...rest }) => ({
          newValue: toRaw(reactive),
          ...rest
        }))

        withNew.forEach(({ newValue, previousValue, fire }) => {
          fire({
            previousValue,
            newValue
          })
        })

        return result
      }
    }

    return new Proxy(clonedTarget, handler)
  }

  return createProxy(data) as never as Reactive<Data>
}

type Fire<T extends object> = (values: {
  newValue: T
  previousValue: T
}) => void

export const watch = <T extends Reactive<object>>(
  reactive: T,
  callback: Fire<T>
) => {
  type Watcher = { reactive: T; fire: Fire<T> }
  type Watchables = Watcher[]

  const watchables: Watchables = reactive[$WATCHABLES as never]

  const watcher: Watcher = { reactive, fire: callback }

  watchables.push(watcher)

  return () => {
    const index = watchables.indexOf(watcher)

    watchables.splice(index, 1)
  }
}
