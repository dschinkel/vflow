import { describe, it, expect, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import type { ServerResponse } from 'http'
import { openStream, streamToAll, clearClients } from './boardStream'
import type { StoryMapState } from '../src/types'

function fakeResponse() {
  const emitter = new EventEmitter()
  const written: string[] = []
  const res = Object.assign(emitter, {
    setHeader: () => {},
    flushHeaders: () => {},
    write: (chunk: string) => { written.push(chunk); return true },
    written,
  }) as unknown as ServerResponse & { written: string[] }
  return res
}

const emptyState: StoryMapState = { title: '', valueStory: null, activeStickyText: null, activities: [] }

beforeEach(() => clearClients())

describe('boardStream', () => {
  it('registers a client when a stream is opened', () => {
    const res = fakeResponse()
    openStream(res)
    streamToAll(emptyState)
    expect(res.written).toHaveLength(1)
  })

  it('sends SSE-formatted data to all open clients', () => {
    const res = fakeResponse()
    openStream(res)
    streamToAll({ ...emptyState, title: 'Payments Flow' })
    expect(res.written[0]).toBe(`data: ${JSON.stringify({ ...emptyState, title: 'Payments Flow' })}\n\n`)
  })

  it('removes a client when the connection closes', () => {
    const res = fakeResponse()
    openStream(res)
    res.emit('close')
    streamToAll(emptyState)
    expect(res.written).toHaveLength(0)
  })

  it('broadcasts to multiple open clients simultaneously', () => {
    const a = fakeResponse()
    const b = fakeResponse()
    openStream(a)
    openStream(b)
    streamToAll(emptyState)
    expect(a.written).toHaveLength(1)
    expect(b.written).toHaveLength(1)
  })
})
