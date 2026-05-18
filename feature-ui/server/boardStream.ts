import type { ServerResponse } from 'http'
import type { StoryMapState } from '../src/types'

const clients = new Set<ServerResponse>()

export function openStream(res: ServerResponse): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  clients.add(res)
  res.on('close', () => clients.delete(res))
}

export function streamToAll(data: StoryMapState): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const client of clients) client.write(payload)
}

export function clearClients(): void {
  clients.clear()
}
