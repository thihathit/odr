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
