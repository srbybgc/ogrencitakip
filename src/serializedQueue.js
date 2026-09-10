export function createSerializedQueue(task) {
  const queues = new Map()
  return (key, value) => {
    const state = queues.get(key) || { running: false, pending: undefined, waiters: [] }
    state.pending = value
    const promise = new Promise((resolve, reject) => state.waiters.push({ resolve, reject }))
    queues.set(key, state)

    if (state.running) return promise

    state.running = true
    const run = async () => {
      try {
        while (state.pending !== undefined) {
          const nextValue = state.pending
          state.pending = undefined
          await task(key, nextValue)
        }
        const waiters = state.waiters.splice(0)
        waiters.forEach(waiter => waiter.resolve())
      } catch (error) {
        const waiters = state.waiters.splice(0)
        waiters.forEach(waiter => waiter.reject(error))
      } finally {
        state.running = false
        if (state.pending === undefined && state.waiters.length === 0) queues.delete(key)
        else if (!state.running) void run()
      }
    }
    void run()
    return promise
  }
}
