import type { Activity } from '../../types'
import GridBackground from '../atoms/GridBackground'
import SuggestionBar from '../organisms/SuggestionBar'
import ActivityColumn from '../organisms/ActivityColumn'

interface Props {
  title: string
  valueStory: string | null
  activities: Activity[]
  suggestedNextText: string | null
}

export default function BoardLayout({ title, valueStory, activities, suggestedNextText }: Props) {
  return (
    <div className="board-layout">
      <GridBackground />
      <header className="board-header">
        <h1 className="board-title">{title}</h1>
        {valueStory && <p className="board-value-story">{valueStory}</p>}
      </header>
      <SuggestionBar stickyText={suggestedNextText} />
      <div className="board-columns">
        {activities.map((a, i) => (
          <ActivityColumn key={a.name} index={i} name={a.name} stickies={a.stickies} />
        ))}
      </div>
    </div>
  )
}
