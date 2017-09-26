export type EventHandler = (...args:any[]) => void;

export default class EventEmitter {
    private listeners:EventHandler[] = []

    on(cb: EventHandler): () => void {
        this.listeners.push(cb)
        return () => {
            const index = this.listeners.indexOf(cb)
            if (index !== -1) this.listeners.splice(index, 1)
        }
    }

    emit(...args:any[]) {
        this.listeners.forEach(fn => fn(...args))
    }
}
