import '@testing-library/jest-dom'

class EventSourceStub {
  onmessage: ((e: { data: string }) => void) | null = null
  close() {}
}

Object.defineProperty(global, 'EventSource', { value: EventSourceStub, writable: true, configurable: true })
