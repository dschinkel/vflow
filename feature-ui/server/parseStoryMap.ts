import fs from 'fs'
import type { StoryMapState, Activity } from '../src/types'

export function parseStoryMap(filePath: string): StoryMapState {
  if (!fs.existsSync(filePath)) {
    return { title: '', valueStory: null, activeStickyText: null, activities: [] }
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  let title = ''
  let valueStory: string | null = null
  const activities: Activity[] = []
  let current: Activity | null = null

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim()
    } else if (line.startsWith('> ') && !line.startsWith('> *Completed')) {
      valueStory = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      current = { name: line.slice(3).trim(), stickies: [] }
      activities.push(current)
    } else if (current && line.startsWith('- [x] ')) {
      current.stickies.push({ text: line.slice(6).trim(), state: 'done' })
    } else if (current && line.startsWith('- [ ] ')) {
      current.stickies.push({ text: line.slice(6).trim(), state: 'todo' })
    } else if (current) {
      const deferred = line.match(/^- ~~(.+)~~ \*\(deferred\)\*$/)
      if (deferred) current.stickies.push({ text: deferred[1], state: 'deferred' })
    }
  }

  return { title, valueStory, activeStickyText: null, activities }
}
