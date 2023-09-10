type Watcher<T> = (newValue: T, previousValue: T) => void

export class Atom<TData> {
  #_watchers: Watcher<TData>[]

  data: TData

  constructor(data: TData) {
    this.#_watchers = []
    this.data = data
  }

  update = (newData: (previousData: TData) => TData) => {
    const previousValue = this.data
    const newValue = newData(previousValue)

    this.data = newValue

    this.#_watchers.forEach(fire => fire(newValue, previousValue))
  }

  watch = (watcher: Watcher<TData>) => {
    this.#_watchers.push(watcher)

    const cleanup = () => {
      const index = this.#_watchers.indexOf(watcher)

      this.#_watchers.splice(index, 1)
    }

    return cleanup
  }
}

// Functional style of `Atom` class
export const createAtom = <TData>(data: TData) => {
  const store = { data }
  const watchers: Watcher<TData>[] = []

  const update = (newData: (previousData: TData) => TData) => {
    const previousValue = store.data
    const newValue = newData(previousValue)

    store.data = newValue

    watchers.forEach(fire => fire(newValue, previousValue))
  }
  const watch = (watcher: Watcher<TData>) => {
    watchers.push(watcher)

    const cleanup = () => {
      const index = watchers.indexOf(watcher)
      watchers.splice(index, 1)
    }

    return cleanup
  }
  return [store.data, { update, watch }] as const
}
