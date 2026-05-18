import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseStoryMap } from './parseStoryMap'

let tmpDir: string

beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'story-map-')) })
afterEach(() => { fs.rmSync(tmpDir, { recursive: true }) })

function write(content: string) {
  const p = path.join(tmpDir, 'story-map.md')
  fs.writeFileSync(p, content)
  return p
}

describe('parseStoryMap', () => {
  it('returns empty state when the file does not exist', () => {
    const result = parseStoryMap('/nonexistent/story-map.md')
    expect(result).toEqual({ title: '', valueStory: null, activeStickyText: null, activities: [] })
  })

  it('reads the feature title from the top-level heading', () => {
    const p = write('# Payments Flow\n')
    expect(parseStoryMap(p).title).toBe('Payments Flow')
  })

  it('reads the value story from the blockquote below the title', () => {
    const p = write('# Payments Flow\n\n> As a buyer, I want to pay.\n')
    expect(parseStoryMap(p).valueStory).toBe('As a buyer, I want to pay.')
  })

  it('ignores the completion date blockquote as a value story', () => {
    const p = write('# Payments Flow\n\n> *Completed: 2026-05-18*\n\n## Checkout\n- [ ] Pay\n')
    expect(parseStoryMap(p).valueStory).toBeNull()
  })

  it('parses a todo sticky as todo state', () => {
    const p = write('# F\n\n## Checkout\n- [ ] Proceed to checkout\n')
    const [col] = parseStoryMap(p).activities
    expect(col.stickies[0]).toEqual({ text: 'Proceed to checkout', state: 'todo' })
  })

  it('parses a done sticky as done state', () => {
    const p = write('# F\n\n## Checkout\n- [x] View cart summary\n')
    const [col] = parseStoryMap(p).activities
    expect(col.stickies[0]).toEqual({ text: 'View cart summary', state: 'done' })
  })

  it('parses a deferred sticky as deferred state', () => {
    const p = write('# F\n\n## Checkout\n- ~~Email receipt~~ *(deferred)*\n')
    const [col] = parseStoryMap(p).activities
    expect(col.stickies[0]).toEqual({ text: 'Email receipt', state: 'deferred' })
  })

  it('groups stickies under their activity column', () => {
    const p = write('# F\n\n## Checkout\n- [ ] Pay\n\n## Confirm\n- [x] Show receipt\n')
    const { activities } = parseStoryMap(p)
    expect(activities).toHaveLength(2)
    expect(activities[0].name).toBe('Checkout')
    expect(activities[1].name).toBe('Confirm')
  })

  it('always sets activeStickyText to null (injected by server at runtime)', () => {
    const p = write('# F\n\n## Checkout\n- [ ] Pay\n')
    expect(parseStoryMap(p).activeStickyText).toBeNull()
  })
})
