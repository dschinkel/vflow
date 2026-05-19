export type StickyState = 'todo' | 'done' | 'deferred' | 'active' | 'streaming'

export interface StickyItem {
  text: string
  state: StickyState
}

export interface Activity {
  name: string
  stickies: StickyItem[]
}

export interface StoryMapState {
  title: string
  valueStory: string | null
  activeStickyText: string | null
  activities: Activity[]
}
