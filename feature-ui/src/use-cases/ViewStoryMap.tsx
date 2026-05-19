import { useState, useEffect } from 'react'
import type { StoryMapState, Activity, StickyItem } from '../types'
import BoardLayout from '../components/templates/BoardLayout'

function withActiveState(activities: Activity[], activeStickyText: string | null): Activity[] {
  return activities.map(a => ({
    ...a,
    stickies: a.stickies.map((s: StickyItem) =>
      s.text === activeStickyText && s.state === 'todo'
        ? { ...s, state: 'active' as const }
        : s
    )
  }))
}

function firstTodo(activities: Activity[]): string | null {
  for (const a of activities) {
    for (const s of a.stickies) {
      if (s.state === 'todo') return s.text
    }
  }
  return null
}

export default function ViewStoryMap() {
  const [mapState, setMapState] = useState<StoryMapState | null>(null)

  useEffect(() => {
    const boardStream = new EventSource('/events')
    boardStream.onmessage = (e: MessageEvent) => setMapState(JSON.parse(e.data) as StoryMapState)
    return () => boardStream.close()
  }, [])

  if (!mapState) return <div className="loading">Loading story map…</div>

  const activities = withActiveState(mapState.activities, mapState.activeStickyText)

  return (
    <BoardLayout
      title={mapState.title}
      valueStory={mapState.valueStory}
      activities={activities}
      suggestedNextText={firstTodo(activities)}
    />
  )
}
